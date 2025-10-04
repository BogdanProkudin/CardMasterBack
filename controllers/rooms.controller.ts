// src/modules/rooms/controller.ts
import { Request, Response } from "express";
import { Room } from "../models/room";
import { RoomPlayer } from "../models/roomPlayers";
import { createRoomSchema } from "../utils/roomsDto";
import { BadRequest, Conflict, NotFound } from "../utils/httpErrors";
import { generateInviteCode } from "../utils/generateInvateCode";
import { isValidObjectId } from "mongoose";
import { User } from "../models/user";

export const createRoom = async (req: Request, res: Response) => {
  const parse = createRoomSchema.safeParse(req.body);
  console.log("par", parse);

  if (!parse.success) {
    throw BadRequest("Validation error");
  }

  const dto = parse.data;
  const ownerId = (req as any).user.sub;

  const user = await User.findById({ _id: ownerId });

  if (!user) {
    throw BadRequest("Validation error");
  }

  try {
    const session = await Room.startSession(); // 👈 открываем MongoDB session (транзакция)
    let roomDoc;
    await session.withTransaction(async () => {
      // проверяем, что пользователь не сидит уже в другой активной комнате
      const activePlayer = await RoomPlayer.exists({
        userId: ownerId,
        active: true, // у тебя должно быть поле active в RoomPlayer
      }).session(session);

      if (activePlayer) {
        throw BadRequest("User already in active room");
      }

      // создаём комнату
      roomDoc = await Room.create(
        [
          {
            ownerId,
            status: "waiting",
            mode: dto.gameMode,
            roomType: dto.roomType,
            inviteCode:
              dto.roomType === "private" ? generateInviteCode() : undefined,
            settings: {
              maxPlayers: dto.maxPlayers,
              minBet: dto.minBet,
              maxBet: dto.maxBet,
              startingBalance: dto.startingBalance,
              dealerSoft17: dto.dealerSoft17,
              decks: dto.decks,
              allowInsurance: dto.allowInsurance,
              maxSplits: dto.maxSplits,
              doubleRule: dto.doubleRule,
              turnTimerSec: dto.turnTimerSec,
            },
          },
        ],
        { session }
      ).then((r) => r[0]);

      // создаём запись для игрока (host)
      await RoomPlayer.create(
        [
          {
            roomId: roomDoc!._id,
            userId: ownerId,
            name: user.name,
            seat: 1,
            bet: 0,
            balance: dto.startingBalance,
            isHost: true,
            active: true, // 👈 важно, иначе проверка выше не будет работать
          },
        ],
        { session }
      );
    });
    session.endSession();

    res
      .status(201)
      .setHeader("Location", `/api/v1/rooms/${roomDoc!._id.toString()}`)
      .json({ roomId: roomDoc!._id.toString() });
  } catch (err: any) {
    console.error(err);

    if (err?.message === "User already in active room") {
      throw Conflict("You are already in the room");
    }

    // возможный конфликт уникальности inviteCode/seat
    return res.status(500).json({ error: "CreateRoomFailed" });
  }
};

export async function getRoomById(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.sub;
    const { roomId } = req.params;

    if (!roomId || !isValidObjectId(roomId)) {
      return res.status(400).json({ error: "Invalid roomId" });
    }

    // 1) Берём комнату (только нужные поля)
    const room = await Room.findById(roomId, {
      ownerId: 1,
      status: 1,
      mode: 1,
      roomType: 1,
      visibility: 1,
      settings: 1,
      createdAt: 1,
      updatedAt: 1,
    }).lean();

    if (!room) {
      return res.status(404).json({ error: "RoomNotFound" });
    }

    // 2) Подтягиваем игроков/места
    const players = await RoomPlayer.find(
      { roomId },
      {
        userId: 1,
        name: 1,
        seat: 1,
        bet: 1,
        balance: 1,
        connected: 1,
        active: 1,
        isHost: 1,
        joinedAt: 1,
      }
    )
      .populate("userId", "userId") // только публичные поля
      .sort({ seat: 1 })
      .lean();

    if (room && !players) {
      console.log("this room has no player it will be deleted ");
      return;
    }

    // 3) Проверка доступа для приватных комнат
    if (room.roomType === "private") {
      const isOwner = String(room.ownerId) === String(userId);
      const isParticipant = players.some(
        (p) => String(p.userId?._id ?? p.userId) === String(userId)
      );
      if (!isOwner && !isParticipant) {
        return res.status(403).json({ error: "Forbidden" });
      }
    }

    // 4) Отдаём единый shape
    return res.status(200).json({ room, players });
  } catch (err) {
    // Централизованная обработка или локально:
    console.error("ERROR WHILE GETTING ROOM DATA", err);
    return res.status(500).json({ error: "GetRoomFailed" });
  }
}
