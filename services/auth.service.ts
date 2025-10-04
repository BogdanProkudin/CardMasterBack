// src/services/auth.service.ts
import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import { User, IUser } from "../models/user";
import { Conflict, NotFound } from "../utils/httpErrors";

// ———————————————————————————
// Вспомогалки
// ———————————————————————————
export const normalizeEmail = (email: string) => {
  return email.trim().toLowerCase();
};

export const buildPublicUser = (user: IUser) => {
  return {
    id: (user as any)._id?.toString?.() ?? (user as any).id,
    email: user.email,
    name: user.name,
    roles: user.roles,
    balance: user.balance,
    emailVerified: (user as any).emailVerified ?? false,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

// ———————————————————————————
// Пароли
// ———————————————————————————
export const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const verifyPassword = (plain: string, hash: string) => {
  return bcrypt.compare(plain, hash);
};

// ———————————————————————————
// Пользователи
// ———————————————————————————
export const ensureEmailUnique = async (email: string) => {
  const exists = await User.findOne({ email: normalizeEmail(email) })
    .lean()
    .exec();
  if (exists) throw Conflict("Email already in use", "ERR_EMAIL_TAKEN");
};

export const createUser = async (input: {
  email: string;
  password: string;
  name?: string;
}) => {
  const email = normalizeEmail(input.email);
  await ensureEmailUnique(email);
  const passwordHash = await hashPassword(input.password);

  const user = await User.create({
    email,
    passwordHash,
    name: input.name,
    roles: ["user"],
    balance: 2000,
    // Добавь поле в схему User заранее:
    emailVerified: { type: Boolean, default: false },
  });

  return user;
};

export const findUserByEmail = (email: string) => {
  return User.findOne({ email: normalizeEmail(email) }).exec();
};

export const findUserByName = (name: string) => {
  return User.findOne({ name }).exec();
};

export const findUserById = (userId: string) => {
  return User.findById(userId).exec();
};

export const requireUserByEmail = async (email: string) => {
  const user = await findUserByEmail(email);
  if (!user) throw NotFound("User not found", "ERR_USER_NOT_FOUND");
  return user;
};

export const requireUserById = async (userId: string) => {
  const user = await findUserById(userId);
  if (!user) throw NotFound("User not found", "ERR_USER_NOT_FOUND");
  return user;
};

// ———————————————————————————
// Операции с паролем / профилем
// ———————————————————————————
export const changePassword = async (userId: string, newPassword: string) => {
  const user = await requireUserById(userId);
  user.passwordHash = await hashPassword(newPassword);
  await user.save();
  return user;
};

export const markEmailVerified = async (userId: string) => {
  const user = await requireUserById(userId);
  (user as any).emailVerified = true; // поле должно быть в модели
  await user.save();
  return user;
};
