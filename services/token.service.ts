import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../config/env";
import { RefreshToken } from "../models/refreshToken";
import { IUser } from "../models/user";

export function signAccess(user: IUser) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      roles: user.roles,
      email: user.email,
      name: user.name,
      balance: user.balance,
    },
    env.accessSecret,
    { expiresIn: env.accessTtl }
  );
}

export function signRefreshRaw(user: { id: string }) {
  const jti = crypto.randomUUID();
  return jwt.sign({ sub: user.id, jti }, env.refreshSecret, {
    expiresIn: "7d",
  });
}

const sha256 = (s: string) =>
  crypto.createHash("sha256").update(s).digest("hex");

export async function persistRefresh(
  userId: string,
  raw: string,
  meta: { ip?: string; ua?: string }
) {
  const { jti, exp } = jwt.decode(raw) as any; // decode достаточно, verify не нужен
  return RefreshToken.create({
    user: new Types.ObjectId(userId),
    jti,
    tokenHash: sha256(raw),
    ua: meta.ua,
    ip: meta.ip,
    expiresAt: new Date(exp * 1000),
  });
}

import mongoose, { isValidObjectId, Types } from "mongoose";

export function hashToken(raw: string) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

function asObjectId(id: string) {
  return isValidObjectId(id) ? new Types.ObjectId(id) : id; // если у тебя строковые id — не кастуй
}

export async function rotateRefresh(
  oldRaw: string,
  meta: { ip?: string; ua?: string }
) {
  let payload: any;
  try {
    payload = jwt.verify(oldRaw, env.refreshSecret);
  } catch {
    throw new Error("Invalid refresh token");
  }

  const userId = String(payload.sub);
  const jti = String(payload.jti);
  const hash = sha256(oldRaw);
  const now = new Date();

  // 🔎 Диагностика: посмотри, что реально в БД по каждому критерию
  const byHash = await RefreshToken.findOne({ tokenHash: hash }).lean();

  const byJti = await RefreshToken.findOne({ jti }).lean();
  console.log("Обновление jwt rework");

  const byFull = await RefreshToken.findOne({
    user: asObjectId(userId),
    jti,
    tokenHash: hash,
  }).lean();

  const session = await mongoose.startSession();
  try {
    let result: { newRaw: string; userId: string } | null = null;

    await session.withTransaction(async () => {
      const current = await RefreshToken.findOneAndUpdate(
        {
          user: asObjectId(userId),
          jti,
          tokenHash: hash,
          revokedAt: { $exists: false },
          expiresAt: { $gt: now },
        },
        { $set: { revokedAt: now } },
        { new: true, session }
      );

      if (!current) {
        // Доп. логика: подсказать, что именно не совпало
        const dbg = await RefreshToken.findOne({ tokenHash: hash }).lean();
        if (!dbg) {
          throw new Error(
            "Refresh not found: tokenHash mismatch (вероятно старый формат/другая sha256)"
          );
        }
        if (String(dbg.user) !== String(asObjectId(userId))) {
          throw new Error(
            "Refresh not found: user mismatch (sub не совпадает с user в записи)"
          );
        }
        if (dbg.jti !== jti) {
          throw new Error(
            "Refresh not found: jti mismatch (в токене другой jti)"
          );
        }
        if (dbg.revokedAt) {
          throw new Error(
            "Refresh reused (revokedAt заполнен) — параллельный refresh уже рэнювнул"
          );
        }
        if (!(dbg.expiresAt && dbg.expiresAt > now)) {
          throw new Error(
            "Refresh expired (expiresAt <= now) — проверь exp*1000 при сохранении"
          );
        }
        // fallback
        throw new Error("Refresh not found/expired/reused");
      }

      const newRaw = signRefreshRaw({ id: userId });
      const rec = await persistRefresh(userId, newRaw, meta);
      await RefreshToken.updateOne(
        { _id: current._id },
        { $set: { replacedByTokenId: rec._id } },
        { session }
      );

      result = { newRaw, userId };
    });

    return result!;
  } finally {
    session.endSession();
  }
}
export async function revokeAllUserTokens(userId: string) {
  await RefreshToken.updateMany(
    { user: userId, revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date() } }
  );
}
