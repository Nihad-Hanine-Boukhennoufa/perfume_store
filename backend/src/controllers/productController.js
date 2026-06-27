import Product from '../models/Product.js';
import { deleteImagesByPublicIds, uploadMultipleImages, replaceAllImages } from "../services/productImageService.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const cleanupUploadedFiles = async (files = []) => {
    if (!files?.length) return;
    const publicIds = files.map(f => f.filename);
    await deleteImagesByPublicIds(publicIds);
};

// multer gives booleans as strings — coerce them
const toBool = (val) => val === true || val === "true";

// multer gives arrays as a single string when only 1 item is sent.
// Always return a proper array.
const toArray = (val) => {
    if (!val) return [];
    return Array.isArray(val) ? val : [val];
};


// ─── GET all products ─────────────────────────────────────────────────────────

export const getProducts = async (req, res, next) => {
    try {
        let {
            page = 1, limit = 10, search = '',
            brand, gender, concentration, season,
            minPrice, maxPrice, minRating, maxRating,
            sort = 'newest'
        } = req.query;

        const pageNumber = Math.max(parseInt(page) || 1, 1);
        const limitNumber = Math.min(Math.max(parseInt(limit) || 10, 1), 100);
        const query = {};

        if (search) {
            const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            query.name = { $regex: escaped, $options: "i" };
        }

        if (brand) {
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
        if (minPrice != null || maxPrice != null) {
            query.price = {};
            if (minPrice != null) { const min = parseFloat(minPrice); if (!isNaN(min)) query.price.$gte = min; }
            if (maxPrice != null) { const max = parseFloat(maxPrice); if (!isNaN(max)) query.price.$lte = max; }
        }
        if (minRating != null || maxRating != null) {
            query.rating = {};
            if (minRating != null) { const min = parseFloat(minRating); if (!isNaN(min)) query.rating.$gte = min; }
            if (maxRating != null) { const max = parseFloat(maxRating); if (!isNaN(max)) query.rating.$lte = max; }
        }

        const sortMap = {
            price_asc: { price: 1 },
            price_desc: { price: -1 },
            rating_desc: { rating: -1 },
            newest: { createdAt: -1 },
            oldest: { createdAt: 1 },
        };
        const sortOption = sortMap[sort] ?? sortMap.newest;

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

// ─── GET product by ID ────────────────────────────────────────────────────────

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

// ─── POST create a product ────────────────────────────────────────────────────

export const createProduct = async (req, res, next) => {
    // Track all cloud-uploaded publicIds so we can roll back on any error
    const uploadedCloudIds = [];

    try {
        const {
            name, brand, description, price, stock,
            gender, concentration, season,
        } = req.body;

        // ── Coerce types from multipart strings ──────────────────────────────
        const scentType = toArray(req.body.scentType);
        const isFeatured = toBool(req.body.isFeatured);
        const isPublished = toBool(req.body.isPublished);

        // ── Parse notes from bracket notation ────────────────────────────────
        const rawNotes = parseNoteTexts(req.body);

        // ── Validate required fields ─────────────────────────────────────────
        if (!name || !brand || !description || price == null || stock == null ||
            !gender || !concentration || !scentType.length || !season || !rawNotes.length) {
            await cleanupUploadedFiles(req.files);
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        if (Number(price) < 0 || Number(stock) < 0) {
            await cleanupUploadedFiles(req.files);
            return res.status(400).json({ success: false, message: "Price and stock must be >= 0" });
        }

        // Separate product images from note images
        const productImageFiles = (req.files || []).filter(f => f.fieldname === "images");
        const noteImageFiles = req.files
            ? Object.fromEntries(
                req.files
                    .filter(f => f.fieldname.startsWith("noteImage_"))
                    .map(f => [f.fieldname, f])
            )
            : {};

        if (!productImageFiles.length) {
            return res.status(400).json({ success: false, message: "At least one product image is required" });
        }

        // ── Build product images ─────────────────────────────────────────────
        const images = await uploadMultipleImages(productImageFiles);
        uploadedCloudIds.push(...images.map(img => img.publicId));
        images[0].isPrimary = true;

        // ── Build notes array ────────────────────────────────────────────────
        // Use Promise.all so each uploadMultipleImages call is properly awaited
        const notes = await Promise.all(rawNotes.map(async (n, i) => {
            const noteFile = noteImageFiles[`noteImage_${i}`];
            if (!noteFile) {
                throw Object.assign(
                    new Error(`Image is required for note "${n.text}"`),
                    { statusCode: 400 }
                );
            }
            const [uploaded] = await uploadMultipleImages([noteFile]);
            uploadedCloudIds.push(uploaded.publicId);
            return {
                text: n.text,
                image: { url: uploaded.url, publicId: uploaded.publicId },
            };
        }));

        const savedProduct = await Product.create({
            name, brand, description,
            price: Number(price),
            stock: Number(stock),
            gender, concentration, scentType, season,
            notes, images,
            isFeatured, isPublished,
        });

        res.status(201).json({ success: true, data: savedProduct, message: "Product created successfully" });

    } catch (err) {
        // Roll back any assets already pushed to cloud storage
        if (uploadedCloudIds.length) {
            await deleteImagesByPublicIds(uploadedCloudIds);
        }
        if (err.statusCode === 400) {
            return res.status(400).json({ success: false, message: err.message });
        }
        next(err);
    }
};

// ─── PATCH update a product ───────────────────────────────────────────────────

export const updateProduct = async (req, res, next) => {
    // Track newly uploaded cloud IDs so we can roll back on error
    const uploadedCloudIds = [];

    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            await cleanupUploadedFiles(req.files);
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const {
            name, brand, description, season, gender, concentration,
            replaceImages,
        } = req.body;

        const price = req.body.price != null ? Number(req.body.price) : null;
        const stock = req.body.stock != null ? Number(req.body.stock) : null;
        const scentType = req.body.scentType != null ? toArray(req.body.scentType) : null;
        const isFeatured = req.body.isFeatured != null ? toBool(req.body.isFeatured) : null;
        const isPublished = req.body.isPublished != null ? toBool(req.body.isPublished) : null;
        const removeImages = toArray(req.body.removeImages);

        // Validate numerics
        if (price !== null && price < 0) {
            await cleanupUploadedFiles(req.files);
            return res.status(400).json({ success: false, message: "Price must be >= 0" });
        }
        if (stock !== null && stock < 0) {
            await cleanupUploadedFiles(req.files);
            return res.status(400).json({ success: false, message: "Stock must be >= 0" });
        }

        // Apply scalar updates
        if (name) product.name = name;
        if (brand) product.brand = brand;
        if (description) product.description = description;
        if (price !== null) product.price = price;
        if (stock !== null) product.stock = stock;
        if (gender) product.gender = gender;
        if (concentration) product.concentration = concentration;
        if (season) product.season = season;
        if (scentType !== null) product.scentType = scentType;
        if (isFeatured !== null) product.isFeatured = isFeatured;
        if (isPublished !== null) product.isPublished = isPublished;

        // Handle image removal
        if (removeImages.length > 0) {
            const remaining = product.images.filter(img => !removeImages.includes(img.publicId));
            const productImageFiles = (req.files || []).filter(f => f.fieldname === "images");
            if (remaining.length === 0 && !productImageFiles.length) {
                await cleanupUploadedFiles(req.files);
                return res.status(400).json({ success: false, message: "Product must have at least one image" });
            }
            await deleteImagesByPublicIds(removeImages);
            product.images = remaining;
        }

        // Handle image replacement / appending
        const productImageFiles = (req.files || []).filter(f => f.fieldname === "images");
        if (replaceImages === "true") {
            if (!productImageFiles.length) {
                return res.status(400).json({ success: false, message: "You must upload new images when replacing" });
            }
            // Fix: also delete old note images to avoid storage leaks
            const oldNoteImageIds = product.notes.map(n => n.image?.publicId).filter(Boolean);
            if (oldNoteImageIds.length) {
                await deleteImagesByPublicIds(oldNoteImageIds);
            }

            const newImages = await replaceAllImages(product.images, productImageFiles);
            uploadedCloudIds.push(...newImages.map(img => img.publicId));
            if (newImages.length > 0) newImages[0].isPrimary = true;
            product.images = newImages;
        } else if (productImageFiles.length > 0) {
            const newImages = await uploadMultipleImages(productImageFiles);
            uploadedCloudIds.push(...newImages.map(img => img.publicId));
            product.images.push(...newImages);
        }

        // Handle notes update if sent
        const rawNotes = parseNoteTexts(req.body);
        if (rawNotes.length > 0) {
            const noteImageFiles = req.files
                ? Object.fromEntries(
                    req.files
                        .filter(f => f.fieldname.startsWith("noteImage_"))
                        .map(f => [f.fieldname, f])
                )
                : {};

            product.notes = await Promise.all(rawNotes.map(async (n, i) => {
                const noteFile = noteImageFiles[`noteImage_${i}`];
                if (noteFile) {
                    const [uploaded] = await uploadMultipleImages([noteFile]);
                    uploadedCloudIds.push(uploaded.publicId);
                    return { text: n.text, image: { url: uploaded.url, publicId: uploaded.publicId } };
                }
                // Keep existing image — fields preserved by updated parseNoteTexts
                if (n.existingImageUrl && n.existingImageId) {
                    return { text: n.text, image: { url: n.existingImageUrl, publicId: n.existingImageId } };
                }
                throw Object.assign(
                    new Error(`Image is required for note "${n.text}"`),
                    { statusCode: 400 }
                );
            }));
        }

        const updated = await product.save();
        res.status(200).json({ success: true, data: updated, message: "Product updated successfully" });

    } catch (err) {
        // Roll back any assets already pushed to cloud storage during this request
        if (uploadedCloudIds.length) {
            await deleteImagesByPublicIds(uploadedCloudIds);
        }
        if (err.statusCode === 400) {
            return res.status(400).json({ success: false, message: err.message });
        }
        next(err);
    }
};

// ─── DELETE a product ─────────────────────────────────────────────────────────

export const deleteProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const publicIds = [
            ...product.images.map(img => img.publicId),
            ...product.notes.map(n => n.image?.publicId),
        ].filter(Boolean);

        await deleteImagesByPublicIds(publicIds);
        await product.deleteOne();

        res.status(200).json({ success: true, message: "Product deleted successfully" });
    } catch (err) {
        next(err);
    }
};