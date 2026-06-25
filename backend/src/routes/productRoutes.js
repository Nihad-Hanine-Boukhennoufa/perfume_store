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

router.get('/', getProducts);
router.get('/:id', getProduct);

router.post('/',verifyToken, verifyAdmin, uploadProduct, normalizeFiles, createProduct);
router.put('/:id',verifyToken, verifyAdmin, uploadProduct, normalizeFiles, updateProduct);
router.patch('/:id', verifyToken, verifyAdmin, uploadProduct, normalizeFiles, updateProduct);
router.delete('/:id',verifyToken, verifyAdmin, deleteProduct);

export default router;