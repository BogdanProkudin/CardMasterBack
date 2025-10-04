import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { security } from "./config/security";
import { errorHandler } from "./middleware/error";
import v1Auth from "./routes/auth.routes";
import v1Rooms from "./routes/rooms.routes";

export const app = express();

app.set("trust proxy", 1); // если за прокси/ingress
app.use(helmet(security.helmet as any));
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use("/static", express.static("node_modules"));
app.use(cookieParser());
app.use(express.json({ limit: "200kb" }));

app.use("/api/v1/auth", v1Auth);
app.use("/api/v1/rooms", v1Rooms);

// health
app.get("/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

// centralized errors (последним)
app.use(errorHandler);
