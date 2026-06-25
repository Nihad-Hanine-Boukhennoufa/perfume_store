import express from "express";
import { register, login } from "../controllers/authController.js";
import { uploadAvatar } from "../middleware/upload.js";

const router = express.Router();


router.post(
  "/register",
  uploadAvatar.single("image"), 
  register
);

router.post("/login", login);

export default router;