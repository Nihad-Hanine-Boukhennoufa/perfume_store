import express from "express";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware.js";
import { uploadBrand } from "../middleware/upload.js";
import { validate } from "../middleware/validate.js";
import { createBrandSchema, updateBrandSchema } from "../validators/brandValidator.js";
import {
  createBrand,
  getAllBrands,
  getBrandById,
  updateBrand,
  deleteBrand,
} from "../controllers/brandController.js";

const router = express.Router();

// Public
router.get("/", getAllBrands);
router.get("/:id", getBrandById);

// Admin
router.use(verifyToken, verifyAdmin);
router.post("/", uploadBrand.single("image"), validate(createBrandSchema), createBrand);
router.put("/:id", uploadBrand.single("image"), validate(updateBrandSchema), updateBrand);
router.delete("/:id", deleteBrand);

export default router;