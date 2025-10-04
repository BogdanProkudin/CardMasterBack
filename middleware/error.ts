import { Request, Response, NextFunction } from "express";
import { logger } from "../libs/logger";

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const status = err.status ?? 500;
  const message = err.publicMessage ?? "Internal Server Error";
  if (status >= 500) logger.error(err);
  return res.status(status).json({ message, code: err.code ?? "ERR_GENERIC" });
}
