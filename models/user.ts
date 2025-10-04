// src/models/User.ts
import { Schema, model } from "mongoose";

import { Types } from "mongoose";

export interface IUser {
  _id: Types.UUID;
  email: string;
  passwordHash: string;
  name?: string;
  roles: string[];
  emailVerified?: boolean;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, unique: true, required: true, index: true },
    passwordHash: { type: String, required: true },
    name: { type: String },
    balance: { type: Number },
    roles: { type: [String], default: ["user"] },
    emailVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const User = model<IUser>("User", userSchema, "usersPoker");
