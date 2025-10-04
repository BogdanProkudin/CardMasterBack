import { Server } from "socket.io";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { registerHandlers } from "./room.socket";

type JwtPayload = { sub: string; name: string; iat: number; exp: number };

export function initSockets(server: any) {
  const io = new Server(server, {
    cors: {
      origin: "*", // укажи свой домен
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      // 1) токен из cookie
      const raw = socket.handshake.headers.cookie ?? "";
      const parsed = cookie.parse(raw || "");
      const access = parsed["access"];
      // 2) или из auth (на случай, если без cookie)
      const token = access || socket.handshake.auth?.token;
      if (!token) return next(new Error("Unauthorized"));

      const payload = jwt.verify(token, env.accessSecret) as JwtPayload;
      socket.data.user = { id: payload.sub, name: payload.name };
      next();
    } catch (e) {
      next(new Error("Unauthorized"));
    }
  });

  registerHandlers(io);
  return io;
}
