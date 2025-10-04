"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetConfirmSchema = exports.verifyConfirmSchema = exports.emailOnlySchema = exports.loginSchema = exports.registerSchema = void 0;
var zod_1 = require("zod");
var passwordPolicy_1 = require("./passwordPolicy");
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().refine(passwordPolicy_1.passwordPolicy.check, passwordPolicy_1.passwordPolicy.message),
    name: zod_1.z.string().min(1).max(64).optional(),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
exports.emailOnlySchema = zod_1.z.object({ email: zod_1.z.string().email() });
exports.verifyConfirmSchema = zod_1.z.object({ token: zod_1.z.string().min(20) });
exports.resetConfirmSchema = zod_1.z.object({
    token: zod_1.z.string().min(20),
    newPassword: zod_1.z.string().refine(passwordPolicy_1.passwordPolicy.check, passwordPolicy_1.passwordPolicy.message),
});
