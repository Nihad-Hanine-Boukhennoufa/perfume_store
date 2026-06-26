import express from "express";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware.js";
import { uploadAvatar } from "../middleware/upload.js";
import { 
  getAllUsers, 
  getUserById, 
  getMe,
  updateUserRole,  
  updateMe, 
  changePassword,
  deleteUser } from "../controllers/userController.js";

const router = express.Router();

// User routes
router.get("/me", verifyToken, getMe);
router.put("/me", verifyToken, uploadAvatar.single("image"), updateMe);
router.patch("/change-password", verifyToken, changePassword );

// Admin routes
router.use(verifyToken, verifyAdmin);

router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.patch("/:id/role", updateUserRole);
router.delete("/:id", deleteUser);

export default router;