import Product from '../models/Product.js';
import { deleteCloudinaryImage } from '../utils/cloudinaryHelper.js';

// Get all products
export const getProducts = async (req, res, next) => {
    try {
        let { page = 1, limit = 10, search = ''  } = req.query;

        const pageNumber = Math.max(parseInt(page) || 1, 1);
        const limitNumber = Math.min(Math.max(parseInt(limit) || 10, 1), 100);

        
    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { brand: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const total = await Product.countDocuments(query);

    const products = await Product.find(query)
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber)
      .sort({ createdAt: -1 });

         res.status(200).json({
            success: true,
            data: products,
            pagination: { 
                page: pageNumber, 
                limit: limitNumber, 
                totalPages: Math.ceil(total / limitNumber), 
                totalItems: total 
            }
        });
    } catch (err) {
        next(err);
    };
};

// GET product by ID
export const getProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ 
                success: false, 
                message: "Product not found" 
            });
        }
        res.status(200).json({ success: true, data: product });
    } catch (err) {
        next(err);
    }
};

// Create a new product
export const createProduct = async (req, res, next) => {

    try {
        const { name, brand, description, price, stock, category } = req.body;

        // Validation
         if (!name || !brand || !description || price == null || stock == null || !category) {

            // Clean up uploaded image if validation fails
            if (req.file) await deleteCloudinaryImage(req.file.filename);
            
            return res.status(400).json({ 
                success: false, 
                message: "All fields are required" 
            });
        }

        if (price < 0 || stock < 0) {
            // Clean up uploaded image if validation fails
             if (req.file) await deleteCloudinaryImage(req.file.filename);
            
            return res.status(400).json({ 
                success: false, 
                message: "Price and stock must be >= 0" 
            });
        }

        const newProduct = new Product({
            name,
            brand,
            description,
            price,
            stock,
            category,
            image: req.file ? req.file.path : null,
            imagePublicId: req.file ? req.file.filename : null,  
        });

        const savedProduct = await newProduct.save();

        res.status(201).json({ 
            success: true, 
            data: savedProduct, 
            message: "Product created successfully" 
        });

    } catch (err) {
        // Clean up uploaded image if error occurs
        if (req.file) await deleteCloudinaryImage(req.file.filename);
        next(err);
    }
};

// Update a product
export const updateProduct = async (req, res, next) => {
    try {
    const { name, brand, description, price, stock, category } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      if (req.file) await deleteCloudinaryImage(req.file.filename);
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (price != null && price < 0) {
      if (req.file) await deleteCloudinaryImage(req.file.filename);
      return res.status(400).json({ success: false, message: "Price must be >= 0" });
    }

    if (stock != null && stock < 0) {
      if (req.file) await deleteCloudinaryImage(req.file.filename);
      return res.status(400).json({ success: false, message: "Stock must be >= 0" });
    }

    if (name) product.name = name;
    if (brand) product.brand = brand;
    if (description) product.description = description;
    if (price != null) product.price = price;
    if (stock != null) product.stock = stock;
    if (category) product.category = category;

    // Update the image
     if (req.file) {
      if (product.imagePublicId) await deleteCloudinaryImage(product.imagePublicId);
      product.image = req.file.path;
      product.imagePublicId = req.file.filename;
    }

         const updatedProduct = await product.save();

    res.status(200).json({ success: true, data: updatedProduct, message: "Product updated successfully" });
  } catch (err) {
    if (req.file) await deleteCloudinaryImage(req.file.filename);
    next(err);
  }
};

// Delete a product
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    if (product.imagePublicId) await deleteCloudinaryImage(product.imagePublicId);

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: "Product deleted successfully" });
  } catch (err) {
    next(err);
  }
};