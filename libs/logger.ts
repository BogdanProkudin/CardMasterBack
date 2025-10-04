export const logger = {
  info: (...a: any[]) => console.log("[INFO]", ...a),
  error: (...a: any[]) => console.error("[ERROR]", ...a),
};
