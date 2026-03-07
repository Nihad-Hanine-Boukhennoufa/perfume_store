import express from "express";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware.js";
import { uploadBrand } from "../middleware/upload.js";
import {
  createBrand,
  getAllBrands,
  getBrandById,
  updateBrand,
  deleteBrand,
} from "../controllers/brandController.js";

const router = express.Router();

router.get("/", getAllBrands);
router.get("/:id", getBrandById);
router.use(verifyToken, verifyAdmin);
router.post("/", uploadBrand.single("image"), createBrand);
router.put("/:id", uploadBrand.single("image"), updateBrand);
router.delete("/:id", deleteBrand);

export default router;