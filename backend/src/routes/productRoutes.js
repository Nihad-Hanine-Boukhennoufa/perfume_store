import express from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/productController.js';
import {uploadProduct , normalizeFiles} from '../middleware/upload.js';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

const adminUpload = [verifyToken, verifyAdmin, uploadProduct, normalizeFiles];


router.get('/', getProducts);
router.get('/:id', getProduct);

router.post("/",    adminUpload, createProduct);
router.patch("/:id", adminUpload, updateProduct);
router.delete('/:id',verifyToken, verifyAdmin, deleteProduct);

export default router;
