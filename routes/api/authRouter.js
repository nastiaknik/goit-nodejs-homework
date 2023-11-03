const express = require("express");
const validateBody = require("../../middlewares/validateBody");
const authenticate = require("../../middlewares/authenticate");
const {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  passwordRecoverySchema,
  googleTokenSchema,
} = require("../../schemas/usersSchemas");
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
} = require("../../controllers/auth");

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

module.exports = router;
