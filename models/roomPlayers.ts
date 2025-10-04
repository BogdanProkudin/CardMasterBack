import { Schema, model } from "mongoose";
const RoomPlayerSchema = new Schema({
  roomId: {
    type: Schema.Types.ObjectId,
    ref: "Room",
    index: true,
    required: true,
  },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, ref: "User", required: true },
  seat: { type: Number, required: true },
  bet: { type: Number, required: true },
  balance: { type: Number, default: 0 },
  isHost: { type: Boolean, default: false },
  connected: { type: Boolean, default: true },
  active: { type: Boolean, default: true },
  joinedAt: { type: Date, default: Date.now },
  disconnectedAt: { type: Date, default: null },
  leftAt: { type: Date, default: null },
});
RoomPlayerSchema.index(
  { userId: 1 },
  { unique: true, partialFilterExpression: { active: true } }
);

RoomPlayerSchema.index({ roomId: 1, seat: 1 }, { unique: true });
export const RoomPlayer = model("RoomPlayer", RoomPlayerSchema);
