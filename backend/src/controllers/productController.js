import Product from '../models/Product.js';
import { deleteImagesByPublicIds, uploadMultipleImages, replaceAllImages } from "../services/productImageService.js";


// --- Helper: cleanup uploaded files on error ---
const cleanupUploadedFiles = async (files = []) => {
    if (!files?.length) return;
    const publicIds = files.map(f => f.filename);
    await deleteImagesByPublicIds(publicIds);
};

// GET all products (paginated + search + filter + sort)
export const getProducts = async (req, res, next) => {
    try {
        let {
            page = 1,
            limit = 10,
            search = '',
            // Filters
            brand,
            gender,
            concentration,
            season,
            minPrice,
            maxPrice,
            minRating,
            maxRating,
            // Sorting
            sort = 'newest'
        } = req.query;

        const pageNumber = Math.max(parseInt(page) || 1, 1);
        const limitNumber = Math.min(Math.max(parseInt(limit) || 10, 1), 100);

        const query = {};

        // --- Search ---
        if (search) {
            const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            query.name = { $regex: escaped, $options: "i" };
        }

        // --- Filters ---
        if (brand) {
            // Support comma-separated list of brand IDs: ?brand=id1,id2
            const brands = brand.split(',').map(b => b.trim()).filter(Boolean);
            query.brand = brands.length === 1 ? brands[0] : { $in: brands };
        }

        if (gender) {
            const genders = gender.split(',').map(g => g.trim()).filter(Boolean);
            query.gender = genders.length === 1 ? genders[0] : { $in: genders };
        }

        if (concentration) {
            const concentrations = concentration.split(',').map(c => c.trim()).filter(Boolean);
            query.concentration = concentrations.length === 1 ? concentrations[0] : { $in: concentrations };
        }

        if (season) {
            const seasons = season.split(',').map(s => s.trim()).filter(Boolean);
            query.season = seasons.length === 1 ? seasons[0] : { $in: seasons };
        }

        // Price range
        if (minPrice != null || maxPrice != null) {
            query.price = {};
            if (minPrice != null) {
                const min = parseFloat(minPrice);
                if (!isNaN(min)) query.price.$gte = min;
            }
            if (maxPrice != null) {
                const max = parseFloat(maxPrice);
                if (!isNaN(max)) query.price.$lte = max;
            }
        }

        // Rating range
        if (minRating != null || maxRating != null) {
            query.rating = {};
            if (minRating != null) {
                const min = parseFloat(minRating);
                if (!isNaN(min)) query.rating.$gte = min;
            }
            if (maxRating != null) {
                const max = parseFloat(maxRating);
                if (!isNaN(max)) query.rating.$lte = max;
            }
        }

        // --- Sorting ---
        const sortMap = {
            price_asc:   { price: 1 },
            price_desc:  { price: -1 },
            rating_desc: { rating: -1 },
            newest:      { createdAt: -1 },
            oldest:      { createdAt: 1 },
        };
        const sortOption = sortMap[sort] ?? sortMap.newest;

        // --- Query ---
        const [total, products] = await Promise.all([
            Product.countDocuments(query),
            Product.find(query)
                .populate("brand", "name")
                .sort(sortOption)
                .skip((pageNumber - 1) * limitNumber)
                .limit(limitNumber)
                .lean()
        ]);

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
    }
};


// GET product by ID
export const getProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id).populate("brand", "name");
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }
        res.status(200).json({ success: true, data: product });
    } catch (err) {
        next(err);
    }
};

// POST create a product
export const createProduct = async (req, res, next) => {
    try {
        const {
            name, brand, description, price, stock,
            gender, concentration, scentType, season, notes
        } = req.body;

        // Validate required fields
        if (!name || !brand || !description || price == null || stock == null ||
            !gender || !concentration || !scentType || !season || !notes) {
            await cleanupUploadedFiles(req.files);
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        if (price < 0 || stock < 0) {
            await cleanupUploadedFiles(req.files);
            return res.status(400).json({ success: false, message: "Price and stock must be >= 0" });
        }

        if (!req.files?.length) {
            return res.status(400).json({ success: false, message: "At least one product image is required" });
        }

        const images = uploadMultipleImages(req.files);
        images[0].isPrimary = true;

        const savedProduct = await Product.create({
            name, brand, description, price, stock,
            gender, concentration, scentType, season,
            notes: notes || [],
            images
        });

        res.status(201).json({ success: true, data: savedProduct, message: "Product created successfully" });

    } catch (err) {
        await cleanupUploadedFiles(req.files);
        next(err);
    }
};

// PATCH update a product
export const updateProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            await cleanupUploadedFiles(req.files);
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const {
            name, brand, description, price, stock, gender,
            concentration, scentType, season, notes,
            isFeatured, isPublished,
            removeImages, replaceImages
        } = req.body;

        // Validate numerics
        if (price != null && price < 0) {
            await cleanupUploadedFiles(req.files);
            return res.status(400).json({ success: false, message: "Price must be >= 0" });
        }
        if (stock != null && stock < 0) {
            await cleanupUploadedFiles(req.files);
            return res.status(400).json({ success: false, message: "Stock must be >= 0" });
        }

        // Apply scalar field updates
        const scalarFields = { name, brand, description, price, stock, gender, concentration, scentType, season, notes, isFeatured, isPublished };
        Object.entries(scalarFields).forEach(([key, val]) => {
            if (val != null) product[key] = val;
        });

        // Handle: remove specific images
        if (Array.isArray(removeImages) && removeImages.length > 0) {
            const remaining = product.images.filter(img => !removeImages.includes(img.publicId));

            if (remaining.length === 0 && !req.files?.length) {
                await cleanupUploadedFiles(req.files);
                return res.status(400).json({ success: false, message: "Product must have at least one image" });
            }

            await deleteImagesByPublicIds(removeImages);
            product.images = remaining;
        }

        // Handle: replace all images
        if (replaceImages === "true") {
            if (!req.files?.length) {
                return res.status(400).json({ success: false, message: "You must upload new images when replacing" });
            }
            const newImages = await replaceAllImages(product.images, req.files);
            if (newImages.length > 0) newImages[0].isPrimary = true;
            product.images = newImages;

        // Handle: append new images
        } else if (req.files?.length > 0) {
            product.images.push(...uploadMultipleImages(req.files));
        }

        const updated = await product.save();
        res.status(200).json({ success: true, data: updated, message: "Product updated successfully" });

    } catch (err) {
        await cleanupUploadedFiles(req.files);
        next(err);
    }
};

// DELETE a product
export const deleteProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Delete all Cloudinary images in parallel
        const publicIds = product.images.map(img => img.publicId).filter(Boolean);
        await deleteImagesByPublicIds(publicIds);

        await product.deleteOne();

        res.status(200).json({ success: true, message: "Product deleted successfully" });
    } catch (err) {
        next(err);
    }
};
