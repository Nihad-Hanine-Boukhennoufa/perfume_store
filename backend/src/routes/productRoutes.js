import express from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/productController.js';
import upload from '../middleware/upload.js';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getProducts);
router.get('/getProduct/:id', getProduct);
router.post('/createProduct',verifyToken, verifyAdmin, upload.single('image'), createProduct);
router.put('/updateProduct/:id',verifyToken, verifyAdmin, upload.single('image'),updateProduct);
router.delete('/deleteProduct/:id',verifyToken, verifyAdmin, deleteProduct);

export default router;