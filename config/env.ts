import "dotenv/config";

export const env = {
  port: Number(process.env.PORT ?? 3003),
  nodeEnv: process.env.NODE_ENV ?? "development",
  mongoUri: process.env.MONGO_URI ?? "",

  accessSecret: process.env.JWT_ACCESS_SECRET ?? "",
  refreshSecret: process.env.JWT_REFRESH_SECRET ?? "",
  accessTtl: process.env.ACCESS_TOKEN_TTL ?? "15m",
  refreshTtl: process.env.REFRESH_TOKEN_TTL ?? "7d",

  cookieDomain: process.env.COOKIE_DOMAIN,
  corsOrigin: process.env.CORS_ORIGIN ?? "*",

  smtpHost: process.env.SMTP_HOST,
  smtpPort: process.env.SMTP_PORT,
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  mailFrom: process.env.MAIL_FROM ?? "no-reply@example.com",
  publicAppUrl: process.env.PUBLIC_APP_URL ?? "http://localhost:5173",

  isProd: process.env.NODE_ENV === "production",
};

// safety check
["mongoUri", "accessSecret", "refreshSecret"].forEach((key) => {
  if (!(env as any)[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
});
