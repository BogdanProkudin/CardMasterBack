// models/refresh-token.ts
import { Schema, model, Types } from "mongoose";

const RefreshTokenSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  jti: { type: String, required: true, unique: true, index: true },
  tokenHash: { type: String, required: true, unique: true, index: true }, // sha256(raw)
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, index: true }, // TTL
  revokedAt: { type: Date },
  replacedByTokenId: { type: Schema.Types.ObjectId },
  ua: String,
  ip: String,
});

// авто-удаление по expiresAt
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken = model("RefreshToken", RefreshTokenSchema);
