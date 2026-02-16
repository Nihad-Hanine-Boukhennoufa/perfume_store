import express from "express";
import { register, login } from "../controllers/authController.js";
import upload from "../middleware/upload.js";

const router = express.Router();


router.post("/register", (req, res, next) => {
  upload.single("image")(req, res, function (err) {
    if (err) {
      console.error("Multer Error:", err);
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}, register);

router.post("/login", login);

export default router;