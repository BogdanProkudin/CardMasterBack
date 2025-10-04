// src/modules/rooms/routes.ts
import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { createRoom, getRoomById } from "../controllers/rooms.controller";

const r = Router();
r.post("/create", requireAuth, createRoom);
r.get("/room/:roomId", requireAuth, getRoomById);

export default r;
