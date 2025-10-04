import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { Unauthorized, Forbidden } from "../utils/httpErrors";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const bearer = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  const token = req.cookies?.access || bearer; // ← берём из cookie

  if (!token) throw Unauthorized("No access token");

  try {
    const payload = jwt.verify(token, env.accessSecret) as any;
    (req as any).user = payload;

    next();
  } catch {
    throw Unauthorized("Invalid/expired access token");
  }
}

export const requireRole =
  (...roles: string[]) =>
  (req: any, _res: Response, next: NextFunction) => {
    if (!req.user?.roles?.some((r: string) => roles.includes(r)))
      throw Forbidden();
    next();
  };
