import express from "express";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js"; 
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserRole,
} from "../controllers/userController.js";

const router = express.Router();

// Public route for uploading avatar (authenticated users only)
router.post("/upload-avatar", verifyToken, upload.single("avatar"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: "No file uploaded" 
      });
    }
    
    res.status(200).json({
      success: true,
      data: { 
        imageUrl: `/uploads/${req.file.filename}` 
      },
      message: "Image uploaded successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error uploading image"
    });
  }
});

// Admin routes
router.use(verifyToken, verifyAdmin);
router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.put("/:id", upload.single("image"), updateUser);
router.patch("/:id/role", updateUserRole);
router.delete("/:id", deleteUser);

export default router;