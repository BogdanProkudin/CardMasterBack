import mongoose from "mongoose";
import { env } from "../config/env";
import { logger } from "../libs/logger";

let isConnected = false;

export async function connectDB(retries = 5, delayMs = 2000) {
  if (isConnected) return;

  const opts: mongoose.ConnectOptions = {
    serverSelectionTimeoutMS: 10_000,
    maxPoolSize: 10,
    minPoolSize: 1,
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(env.mongoUri, opts);
      isConnected = true;

      const conn = mongoose.connection;

      conn.on("connected", () => logger.info("Connected"));
      conn.on("disconnected", () => logger.info("Disconnected"));
      conn.on("reconnected", () => logger.info("Reconnected"));
      conn.on("error", (err) => logger.error("Error:", err));

      logger.info(`MongoDB connected (attempt ${attempt}/${retries})`);
      return;
    } catch (err) {
      logger.error(
        `MongoDB connect failed (attempt ${attempt}/${retries})`,
        err
      );
      if (attempt === retries) {
        throw err;
      }
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

export async function disconnectDB() {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  logger.info("MongoDB disconnected");
}

// Грейсфул-шатдаун
process.on("SIGINT", async () => {
  await disconnectDB();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await disconnectDB();
  process.exit(0);
});
