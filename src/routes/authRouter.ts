import express from "express";
import { authControllers } from "../controllers/auth";
import validateBody from "../middlewares/validateBody";
import authenticate from "../middlewares/authenticate";
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  passwordRecoverySchema,
  googleTokenSchema,
} from "../schemas/usersSchemas";
const {
  register,
  login,
  verifyEmail,
  resendVerifyEmail,
  getCurrent,
  logout,
  recoverPassword,
  changePassword,
  googleAuth,
} = authControllers;

const router = express.Router();

router.post("/register", validateBody(registerSchema), register);

router.post("/login", validateBody(loginSchema), login);

router.get("/verify/:verificationToken", verifyEmail);

router.post("/verify", validateBody(verifyEmailSchema), resendVerifyEmail);

router.get("/current", authenticate, getCurrent);

router.post("/logout", authenticate, logout);

router.post("/recovery", validateBody(verifyEmailSchema), recoverPassword);

router.patch(
  "/recovery/:resetToken",
  validateBody(passwordRecoverySchema),
  changePassword
);

router.post("/google", validateBody(googleTokenSchema), googleAuth);

export default router;
