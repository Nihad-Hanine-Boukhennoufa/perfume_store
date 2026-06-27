import express from "express";

import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";

import { uploadProduct } from "../middleware/upload.js";
import { parseProductBody } from "../middleware/parseProductBody.js";
import { validate } from "../middleware/validate.js";
import {
  createProductSchema,
  updateProductSchema,
} from "../validators/productValidator.js";

import {
  verifyToken,
  verifyAdmin,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// Public
router.get("/", getProducts);
router.get("/:id", getProduct);

// Admin
router.post(
  "/",
  verifyToken,
  verifyAdmin,
  uploadProduct,
  parseProductBody,
  validate(createProductSchema),
  createProduct
);

router.patch(
  "/:id",
  verifyToken,
  verifyAdmin,
  uploadProduct,
  parseProductBody,
  validate(updateProductSchema),
  updateProduct
);

router.delete(
  "/:id",
  verifyToken,
  verifyAdmin,
  deleteProduct
);

export default router;