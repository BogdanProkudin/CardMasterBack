import { Router } from "express";
import { limitAuthTight, limitAuthSoft } from "../middleware/rateLimit";
import * as Auth from "../controllers//auth.controller";
import { requireAuth } from "../middleware/auth";

const r = Router();

r.post("/register", limitAuthTight, Auth.register);
r.post("/login", limitAuthTight, Auth.login);
r.post("/refresh", limitAuthSoft, Auth.refresh);
r.post("/logout", requireAuth, Auth.logout); // logout current device
r.post("/logoutAll", requireAuth, Auth.logoutAll); // revoke all devices
r.get("/me", requireAuth, Auth.me);
r.post("/verify-email/request", limitAuthSoft, Auth.requestEmailVerify);
r.post("/verify-email/confirm", limitAuthSoft, Auth.confirmEmailVerify);
r.post("/password/reset/request", limitAuthSoft, Auth.requestPasswordReset);
r.post("/password/reset/confirm", limitAuthSoft, Auth.confirmPasswordReset);

export default r;
