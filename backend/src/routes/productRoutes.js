import express from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/productController.js';
import {uploadProduct} from '../middleware/upload.js';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getProducts);
router.get('/:id', getProduct);

router.post('/',verifyToken, verifyAdmin, uploadProduct.array("images", 5), createProduct);
router.put('/:id',verifyToken, verifyAdmin, uploadProduct.array("images", 5),updateProduct);
router.delete('/:id',verifyToken, verifyAdmin, deleteProduct);

export default router;