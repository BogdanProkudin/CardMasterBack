// models/room.ts
import { Date, Schema, model, type Document, type Model } from "mongoose";
import { number } from "zod";

export type RoomStatus = "waiting" | "active" | "finished" | "inactive";
export type RoomMode = "classic" | "multiplayer";
export type RoomType = "public" | "private";
export type DealerSoft17 = "hit" | "stand";
export type DoubleRule = "any" | "9-11";

export interface RoomSettings {
  maxPlayers: number;
  minBet: number;
  maxBet: number;
  dealerSoft17: DealerSoft17;
  decks: 1 | 4 | 6 | 8;
  startingBalance: number;
  allowInsurance: boolean;
  maxSplits: number;
  doubleRule: DoubleRule;
  turnTimerSec: number;
}

export interface ShoeInfo {
  decks: number;
  penetration: number; // 0..1
  reshuffleAt: number; // 0..1
  hash?: string; // опционально: коммит для честности
}

export interface RoomDoc extends Document {
  ownerId: Schema.Types.ObjectId;
  status: RoomStatus;
  emptySince: Date;
  mode: RoomMode;
  roomType: RoomType;
  inviteCode?: string;
  settings: RoomSettings;
  shoe?: ShoeInfo;
  createdAt: Date;
  updatedAt: Date;
}

const RoomSchema = new Schema<RoomDoc>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["waiting", "active", "finished", "inactive"],
      default: "waiting",
      index: true,
    },
    emptySince: { type: Date, default: null },
    mode: {
      type: String,
      enum: ["classic", "multiplayer"],
      default: "multiplayer",
    },
    roomType: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
    inviteCode: { type: String, sparse: true, unique: true },

    settings: {
      maxPlayers: { type: Number, min: 2, max: 8, required: true },
      minBet: { type: Number, min: 1, required: true },
      maxBet: { type: Number, min: 1, required: true },
      startingBalance: { type: Number, min: 1, required: true },
      dealerSoft17: { type: String, enum: ["hit", "stand"], default: "stand" },
      decks: { type: Number, enum: [1, 4, 6, 8], default: 6 },
      allowInsurance: { type: Boolean, default: true },
      maxSplits: { type: Number, min: 0, max: 3, default: 3 },
      doubleRule: { type: String, enum: ["any", "9-11"], default: "any" },
      turnTimerSec: { type: Number, min: 10, max: 60, default: 20 },
    },

    shoe: {
      decks: { type: Number, default: 6 },
      penetration: { type: Number, min: 0, max: 1, default: 0.75 },
      reshuffleAt: { type: Number, min: 0, max: 1, default: 0.25 },
      hash: { type: String },
    },
  },
  { timestamps: true }
);

// Индексы под поиск лобби и приваток
RoomSchema.index({ status: 1, "settings.maxPlayers": 1 });
RoomSchema.index({ inviteCode: 1 }, { unique: true, sparse: true });

export const Room: Model<RoomDoc> = model<RoomDoc>("PokerRoom", RoomSchema);
