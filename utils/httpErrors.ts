export class HttpError extends Error {
  status: number;
  code?: string;
  publicMessage?: string;
  constructor(status: number, publicMessage: string, code?: string) {
    super(publicMessage);
    this.status = status;
    this.publicMessage = publicMessage;
    this.code = code;
  }
}
export const BadRequest = (m = "Bad request", c = "ERR_BAD_REQUEST") =>
  new HttpError(400, m, c);
export const Unauthorized = (m = "Unauthorized", c = "ERR_UNAUTHORIZED") =>
  new HttpError(401, m, c);
export const Forbidden = (m = "Forbidden", c = "ERR_FORBIDDEN") =>
  new HttpError(403, m, c);
export const NotFound = (m = "NOT_FOUND", c = "ERR_NOT_FOUND") =>
  new HttpError(403, m, c);
export const Conflict = (m = "Conflict", c = "ERR_CONFLICT") =>
  new HttpError(409, m, c);
