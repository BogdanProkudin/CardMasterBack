import { Request, Response } from "express";
import { ah } from "../middleware/asyncHandler";
import {
  loginSchema,
  registerSchema,
  emailOnlySchema,
  resetConfirmSchema,
  verifyConfirmSchema,
} from "../utils/validators";
import { BadRequest, Conflict, Unauthorized } from "../utils/httpErrors";
import {
  findUserByEmail,
  findUserByName,
  hashPassword,
  verifyPassword,
} from "../services/auth.service";
import {
  signAccess,
  signRefreshRaw,
  persistRefresh,
  rotateRefresh,
  revokeAllUserTokens,
} from "../services/token.service";
import { User } from "../models/user";
import { sendVerifyEmail, sendResetEmail } from "../services/mail.service";

const ACCESS_TTL_MS = 15 * 60 * 1000; // 15m
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7d (или 30d — как нужно)

export const accessCookieOpts = (res: Response) => ({
  ...res.req.app.get("cookieBase"),
  path: "/",
  maxAge: ACCESS_TTL_MS,
});

export const refreshCookieOpts = (res: Response) => ({
  ...res.req.app.get("cookieBase"),
  path: "/",
  maxAge: REFRESH_TTL_MS,
});

export function setAccessCookie(res: Response, token: string) {
  res.cookie("access", token, accessCookieOpts(res));
}

export function setRefreshCookie(res: Response, token: string) {
  res.cookie("refreshToken", token, refreshCookieOpts(res));
}

export function clearAuthCookies(res: Response) {
  const base = res.req.app.get("cookieBase");
  res.clearCookie("access", { ...base, path: "/" });
  res.clearCookie("refreshToken", { ...base, path: "/api/v1/auth/refresh" });
}

export const register = ah(async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) throw BadRequest("Invalid register data");

  const { email, password, name } = parsed.data;

  if (!email || !password || !name) throw BadRequest("Invalid register data");

  if (await findUserByName(name)) throw Conflict("Username already in use");
  if (await findUserByEmail(email)) throw Conflict("Email already in use");

  const passwordHash = await hashPassword(password);
  const user = await User.create({
    email,
    passwordHash,
    name,
    balance: 2000,
    emailVerified: false,
    roles: ["user"],
  });

  // await sendVerifyEmail(user);

  const access = signAccess(user);
  const refresh = signRefreshRaw(user);

  await persistRefresh(user.id, refresh, {
    ip: req.ip,
    ua: req.headers["user-agent"],
  });

  setAccessCookie(res, access);
  setRefreshCookie(res, refresh);

  res.status(201).json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles,
      balance: user.balance,
    },
    requiresEmailVerification: !user.emailVerified,
  });
});

export const login = ah(async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) throw BadRequest("Invalid login data");

  const { email, password } = parsed.data;
  const user = await findUserByEmail(email);
  if (!user) throw Unauthorized("Invalid email or password");

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) throw Unauthorized("Invalid email or password");

  const access = signAccess(user);
  const refresh = signRefreshRaw(user);

  await persistRefresh(user.id, refresh, {
    ip: req.ip,
    ua: req.headers["user-agent"],
  });

  setAccessCookie(res, access);
  setRefreshCookie(res, refresh);

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      balance: user.balance,
      roles: user.roles,
    },
  });
});

export const refresh = ah(async (req: Request, res: Response) => {
  const old = req.cookies?.refreshToken;
  console.log("get it", old);

  if (!old) throw Unauthorized("No refresh token");

  const { newRaw, userId } = await rotateRefresh(old, {
    ip: req.ip,
    ua: req.headers["user-agent"],
  });

  // новый refresh + новый access
  const user = await User.findById(userId).lean().exec();
  if (!user) throw Unauthorized("Invalid refresh token");

  const newAccess = signAccess(user);

  setAccessCookie(res, newAccess);
  setRefreshCookie(res, newRaw);

  res.status(204).send(); // тело не нужно
});

export const logout = ah(async (_req: Request, res: Response) => {
  clearAuthCookies(res);
  res.status(204).send();
});

export const logoutAll = ah(async (req: any, res: Response) => {
  await revokeAllUserTokens(req.user.sub); // req.user — из auth middleware (access cookie)
  clearAuthCookies(res);
  res.status(204).send();
});

export const me = ah(async (req: any, res: Response) => {
  // req.user забирается из access cookie вашим auth-middleware (проверка подписи + загрузка профиля)
  console.log("req", req.user);
  res.json({ user: req.user });
});

// ——— Email verify + Password reset: без изменений скелетов ———

export const requestEmailVerify = ah(async (req: Request, res: Response) => {
  const parsed = emailOnlySchema.safeParse(req.body);
  if (!parsed.success) throw BadRequest("Invalid email");
  const user = await findUserByEmail(parsed.data.email);
  if (user) await sendVerifyEmail(user);
  res.json({ ok: true });
});

export const confirmEmailVerify = ah(async (req: Request, res: Response) => {
  const parsed = verifyConfirmSchema.safeParse(req.body);
  if (!parsed.success) throw BadRequest("Invalid token");
  // проверить токен, пометить user.emailVerified = true
  res.json({ ok: true });
});

export const requestPasswordReset = ah(async (req: Request, res: Response) => {
  const parsed = emailOnlySchema.safeParse(req.body);
  if (!parsed.success) throw BadRequest("Invalid email");
  const user = await findUserByEmail(parsed.data.email);
  if (user) await sendResetEmail(user);
  res.json({ ok: true });
});

export const confirmPasswordReset = ah(async (req: Request, res: Response) => {
  const parsed = resetConfirmSchema.safeParse(req.body);
  if (!parsed.success) throw BadRequest("Invalid data");
  // верифицировать reset-токен, обновить passwordHash
  res.json({ ok: true });
});
