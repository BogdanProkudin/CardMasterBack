// src/modules/rooms/dto.ts
import { z } from "zod";
const decksSchema = z.union([
  z.literal(1),
  z.literal(4),
  z.literal(6),
  z.literal(8),
]);

export const createRoomSchema = z.object({
  maxPlayers: z.number().int().min(2).max(8),
  minBet: z.number().int().min(1),
  maxBet: z.number().int().min(1),
  gameMode: z.enum(["classic", "multiplayer"]).default("multiplayer"),
  roomType: z.enum(["public", "private"]).default("public"),
  startingBalance: z.number().int().min(0).default(5000),
  // опционально: правила
  dealerSoft17: z.enum(["hit", "stand"]).default("stand"),
  decks: decksSchema.default(6),
  allowInsurance: z.boolean().default(true),
  maxSplits: z.number().int().min(0).max(3).default(3),
  doubleRule: z.enum(["any", "9-11"]).default("any"),
  turnTimerSec: z.number().int().min(10).max(60).default(20),
});

export type CreateRoomDto = z.infer<typeof createRoomSchema>;
