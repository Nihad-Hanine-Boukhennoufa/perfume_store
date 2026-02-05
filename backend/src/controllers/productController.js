import Product from '../models/Product.js';

// Get all products
export const getProducts = async (req, res, next) => {
    try {
        let { page = 1, limit = 10 } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);

        const products = await Product.find()
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Product.countDocuments();

        res.status(200).json({
            success: true,
            data: products,
            pagination: { page, limit, totalPages: Math.ceil(total / limit), totalItems: total },
        });
    } catch (err) {
        next(err);
    };
};

// GET product by ID
export const getProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: "Product not found" });
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
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        if (price < 0 || stock < 0) {
            return res.status(400).json({ success: false, message: "Price and stock must be >= 0" });
        }

        const newProduct = new Product({
            ...req.body,
            image: req.file ? req.file.filename : ""
        });

        const savedProduct = await newProduct.save();

        res.status(201).json({ success: true, data: savedProduct, message: "Product created successfully" });
    } catch (err) {
        next(err);
    }
};

// Update a product
export const updateProduct = async (req, res, next) => {
    try {
        const updatedData = { ...req.body };

        // If a new image file is uploaded, update the image field
        if (req.file) {
            updatedData.image = req.file.filename;
        }
        if (updatedData.price != null && updatedData.price < 0) {
            return res.status(400).json({ success: false, message: "Price must be >= 0" });
        }
        if (updatedData.stock != null && updatedData.stock < 0) {
            return res.status(400).json({ success: false, message: "Stock must be >= 0" });
        }
        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updatedData, { new: true });
        if (!updatedProduct) return res.status(404).json({ success: false, message: "Product not found" });

        res.status(200).json({ success: true, data: updatedProduct, message: "Product updated successfully" });
    } catch (err) {
        next(err);
    }
};

// Delete a product
export const deleteProduct = async (req, res, next) => {
    try {
        const deleted = await Product.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ success: false, message: "Product not found" });
        res.status(200).json({ success: true, message: "Product deleted successfully" });
    } catch (err) {
        next(err);
    }
};