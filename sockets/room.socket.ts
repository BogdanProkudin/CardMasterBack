// sockets/room.handlers.ts
import type { Server, Socket } from "socket.io";
import { RoomPlayer } from "../models/roomPlayers";
import { Room } from "../models/room";
import { log } from "console";

const GRACE_MS = 60_000;

// key = `${roomId}:${userId}` → таймер автокика после disconnect
const disconnectTimers = new Map<string, NodeJS.Timeout>();

// учёт мультивкладок: сколько открытых сокетов у юзера в конкретной комнате
const roomConnections = new Map<string, number>();
const keyRU = (roomId: string, userId: string) => `${roomId}:${userId}`;
const incRU = (roomId: string, userId: string) => {
  const k = keyRU(roomId, userId);

  roomConnections.set(k, (roomConnections.get(k) ?? 0) + 1);
  const n = (roomConnections.get(k) ?? 1) - 1;
  return n;
};
const decRU = (roomId: string, userId: string) => {
  const k = keyRU(roomId, userId);

  const n = (roomConnections.get(k) ?? 1) - 1;

  if (n <= 0) roomConnections.delete(k);
  else roomConnections.set(k, n);
  return n;
};

export function registerHandlers(io: Server) {
  io.on("connection", (socket: Socket<any>) => {
    console.log("connection");

    // ---- JOIN ----
    socket.on(
      "room:join",
      async ({ roomId }: { roomId: string }, cb?: (r: any) => void) => {
        try {
          const userId = socket.data.user.id;
          const userName = socket.data.user.name;

          console.log("user join", userId);

          // 0) проверим, что комната живая (не inactive/finished)
          const room = await Room.findById(roomId, { status: 1 }).lean();
          if (!room) return cb?.({ ok: false, error: "RoomNotFound" });
          if (room.status === "inactive" || room.status === "finished") {
            return cb?.({ ok: false, error: "RoomClosed" });
          }

          // 1) пробуем «уже сидит активным» → просто помечаем connected
          let seat = await RoomPlayer.findOneAndUpdate(
            { roomId, userId, active: true },
            { $set: { connected: true }, $unset: { disconnectedAt: "" } },
            { new: true }
          );

          // 2) если нет — авто-посадка ТОЛЬКО в предсозданные пустые места (userId: null)
          if (!seat) {
            console.log("начало автопосадки", userId);
            const playersSeat = (
              await RoomPlayer.find({ roomId: roomId })
            ).sort((user) => user.seat);
            const newPlayerSeat = playersSeat[playersSeat.length - 1].seat + 1;
            console.log("player seat", newPlayerSeat);

            const seat = await RoomPlayer.create([
              {
                roomId: roomId,
                userId: { _id: userId },
                name: userName,
                seat: newPlayerSeat,
                bet: 0,
                balance: 1000, //изменить в скором времене
                isHost: false,
                active: true,
              },
            ]);

            if (!seat) return cb?.({ ok: false, error: "NoFreeSeats" });
            const snapshot = await buildRoomSnapshot(roomId);
            const joinedPlayer = snapshot.players.find((player) =>
              player.userId._id.equals(userId)
            );
            socket.to(`room:${roomId}`).emit("player:joined", {
              player: joinedPlayer,
            });

            console.log("uer joined");
          }

          // 3) присоединяем сокет к комнате и сохраняем связь
          socket.data.roomId = roomId;
          socket.join(`room:${roomId}`);
          incRU(roomId, userId);

          // 4) отменяем возможный таймер автокика
          const k = keyRU(roomId, userId);
          const t = disconnectTimers.get(k);
          if (t) {
            clearTimeout(t);
            disconnectTimers.delete(k);
          }

          // 5) убираем TTL-флаг пустой комнаты (кто-то вернулся)
          await Room.updateOne({ _id: roomId }, { $unset: { emptySince: "" } });

          cb?.({ ok: true });

          // 6) отправляем снапшот подключившемуся
          const snapshot = await buildRoomSnapshot(roomId);
          socket.emit("room:state", snapshot);
          console.log("before seat", seat?.connected);

          if (seat && seat.connected) {
            const reconnectedPlayer = snapshot.players.find((player) =>
              player.userId._id.equals(userId)
            );
            console.log("join recconected");

            // 7) всем остальным — событие про возврат игрока
            socket.to(`room:${roomId}`).emit("player:reconnected", {
              player: reconnectedPlayer,
            });
          }
        } catch (e) {
          console.error("room:join error:", e);
          cb?.({ ok: false, error: "JoinFailed" });
        }
      }
    );

    // ---- LEAVE ---- (осознанный выход)
    socket.on("room:leave", async (_: unknown, cb?: (r: any) => void) => {
      try {
        const { roomId } = socket.data;
        const userId = socket.data.user.id;
        if (!roomId) return cb?.({ ok: true });

        // уберём мультивкладку
        decRU(roomId, userId);
        // добровольный выход → сразу деактивируем участие
        await RoomPlayer.updateOne(
          { roomId, userId },
          { $set: { active: false, connected: false, leftAt: new Date() } }
        );

        // чистим возможный таймер (на всякий случай)
        const k = keyRU(roomId, userId);
        const t = disconnectTimers.get(k);
        if (t) {
          clearTimeout(t);
          disconnectTimers.delete(k);
        }

        socket.leave(`room:${roomId}`);
        socket.data.roomId = undefined;

        // если комната опустела — пометим на автоудаление TTL'ом
        const hasActive = await RoomPlayer.exists({ roomId, active: true });
        if (!hasActive) {
          await Room.updateOne(
            { _id: roomId },
            { $set: { status: "inactive", emptySince: new Date() } }
          );
        }

        io.to(`room:${roomId}`).emit("player:left", { userId });

        cb?.({ ok: true });
      } catch (e) {
        console.error("room:leave error:", e);
        cb?.({ ok: false });
      }
    });

    // ---- DISCONNECT ---- (закрыл вкладку / сеть пропала)
    socket.on("disconnect", async () => {
      try {
        const userId = socket.data.user?.id;
        const roomId = socket.data.roomId
          ? socket.data.roomId
          : await RoomPlayer.findOne({ _id: userId });

        console.log("disconnect", userId, roomId);

        if (!roomId || !userId) return;

        // уменьшаем счётчик мультивкладок
        const left = decRU(roomId, userId);
        console.log("left is", left);

        if (left > 0) return; // ещё есть активные соединения этого юзера → ничего не делаем

        console.log("left still");

        // помечаем оффлайн
        await RoomPlayer.updateOne(
          { roomId, userId },
          { $set: { connected: false }, $currentDate: { disconnectedAt: true } }
        );

        // запускаем grace-таймер на автосъём
        const k = keyRU(roomId, userId);
        const timer = setTimeout(async () => {
          disconnectTimers.delete(k);

          // если не вернулся — снимаем
          const p = await RoomPlayer.findOne({ roomId, userId });
          if (!p || p.connected) return;

          const room = await Room.findById(roomId, { status: 1 }).lean();
          if (!room) return;

          if (room.status === "waiting" || room.status === "inactive") {
            // жёстко освобождаем место (удаляем запись)
            console.log("удалили юзера");

            await RoomPlayer.deleteOne({ roomId, userId });
          } else {
            // мягко — остаётся в истории раунда, но исключаем из следующих
            await RoomPlayer.updateOne(
              { roomId, userId },
              { $set: { active: false, leftAt: new Date() } }
            );
          }

          const hasActive = await RoomPlayer.exists({ roomId, active: true });
          if (!hasActive) {
            await Room.deleteOne({ _id: roomId });
          }

          io.to(`room:${roomId}`).emit("player:left", { userId });
        }, GRACE_MS);

        disconnectTimers.set(k, timer);
      } catch (e) {
        console.error("disconnect error:", e);
      }
    });
  });
}

// пример снапшота
async function buildRoomSnapshot(roomId: string) {
  const room = await Room.findById(roomId, {
    settings: 1,
    status: 1,
    ownerId: 1,
    mode: 1,
    roomType: 1,
    createdAt: 1,
  }).lean();

  const players = await RoomPlayer.find(
    { roomId },
    {
      userId: 1,
      seat: 1,
      bet: 1,
      name: 1,
      balance: 1,
      connected: 1,
      active: 1,
      isHost: 1,
      joinedAt: 1,
    }
  )
    .populate("userId", "nickname avatarUrl")
    .sort({ seat: 1 })
    .lean();

  return { room, players };
}
