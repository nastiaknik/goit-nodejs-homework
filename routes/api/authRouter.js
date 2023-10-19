const express = require("express");
const validateBody = require("../../middlewares/validateBody");
const authenticate = require("../../middlewares/authenticate");
const {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  passwordRecoverySchema,
} = require("../../schemas/usersSchemas");
const {
  register,
  login,
  verifyEmail,
  resentVerifyEmail,
  getCurrent,
  logout,
  sendRecoveryEmail,
  changeUserPassword,
} = require("../../controllers/auth");

const router = express.Router();

router.post("/register", validateBody(registerSchema), register);

router.post("/login", validateBody(loginSchema), login);

router.get("/verify/:verificationToken", verifyEmail);

router.post("/verify", validateBody(verifyEmailSchema), resentVerifyEmail);

router.get("/current", authenticate, getCurrent);

router.post("/logout", authenticate, logout);

router.post("/recovery", validateBody(verifyEmailSchema), sendRecoveryEmail);

router.patch(
  "/recovery/:resetToken",
  validateBody(passwordRecoverySchema),
  changeUserPassword
);

module.exports = router;
