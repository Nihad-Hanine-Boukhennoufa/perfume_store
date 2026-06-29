import express from "express";
import {
  register,
  login,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
import { uploadAvatar } from "../middleware/upload.js";
import { validate } from "../middleware/validate.js";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validators/authValidator.js";

const router = express.Router();

router.post("/register",
  uploadAvatar.single("image"),
  validate(registerSchema),
  register
);

router.post("/login",
  validate(loginSchema),
  login
);

router.post("/forgot-password",
  validate(forgotPasswordSchema),
  forgotPassword
);

router.post("/reset-password/:token",
  validate(resetPasswordSchema),
  resetPassword
);

export default router;