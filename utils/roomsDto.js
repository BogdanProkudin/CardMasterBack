"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRoomSchema = void 0;
// src/modules/rooms/dto.ts
var zod_1 = require("zod");
var decksSchema = zod_1.z.union([
    zod_1.z.literal(1),
    zod_1.z.literal(4),
    zod_1.z.literal(6),
    zod_1.z.literal(8),
]);
exports.createRoomSchema = zod_1.z.object({
    maxPlayers: zod_1.z.number().int().min(2).max(8),
    minBet: zod_1.z.number().int().min(1),
    maxBet: zod_1.z.number().int().min(1),
    gameMode: zod_1.z.enum(["classic", "multiplayer"]).default("multiplayer"),
    roomType: zod_1.z.enum(["public", "private"]).default("public"),
    startingBalance: zod_1.z.number().int().min(0).default(5000),
    // опционально: правила
    dealerSoft17: zod_1.z.enum(["hit", "stand"]).default("stand"),
    decks: decksSchema.default(6),
    allowInsurance: zod_1.z.boolean().default(true),
    maxSplits: zod_1.z.number().int().min(0).max(3).default(3),
    doubleRule: zod_1.z.enum(["any", "9-11"]).default("any"),
    turnTimerSec: zod_1.z.number().int().min(10).max(60).default(20),
});
