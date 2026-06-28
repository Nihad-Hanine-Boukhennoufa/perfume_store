import mongoose from "mongoose"; // ✅ FIX 1: was missing, needed for ObjectId.isValid()

import Brand from "../models/Brand.js";
import Note from "../models/Note.js";
import Product from "../models/Product.js";
import {
  deleteImagesByPublicIds,
  uploadMultipleImages, // ✅ FIX 2: alias added in productImageService.js (was uploadProductImages)
} from "../services/productImageService.js";

// ─── GET all products ─────────────────────────────────────────────────────────

export const getProducts = async (req, res, next) => {
  try {
    let {
      page = 1,
      limit = 10,
      search,
      brand,
      gender,
      concentration,
      season,
      minPrice,
      maxPrice,
      minRating,
      maxRating,
      sort = "newest",
    } = req.query;

    // ─────────────────────────────
    // 1. Pagination setup
    // ─────────────────────────────
    page = Math.max(parseInt(page) || 1, 1);
    limit = Math.min(Math.max(parseInt(limit) || 10, 1), 100);

    const skip = (page - 1) * limit;

    // ─────────────────────────────
    // 2. Build query object
    // ─────────────────────────────
    const query = {};

    if (search) {
      query.name = {
        $regex: search.trim(),
        $options: "i",
      };
    }

    if (brand) query.brand = brand;
    if (gender) query.gender = gender;
    if (concentration) query.concentration = concentration;

    if (season) {
      query.season = {
        $in: Array.isArray(season) ? season : [season],
      };
    }

    if (minPrice || maxPrice) {
      query["variants.price"] = {};
      if (minPrice) query["variants.price"].$gte = Number(minPrice);
      if (maxPrice) query["variants.price"].$lte = Number(maxPrice);
    }

    if (minRating || maxRating) {
      query.rating = {};
      if (minRating) query.rating.$gte = Number(minRating);
      if (maxRating) query.rating.$lte = Number(maxRating);
    }

    // ─────────────────────────────
    // 3. Sorting
    // ─────────────────────────────
    const sortMap = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      price_asc: { "variants.price": 1 },
      price_desc: { "variants.price": -1 },
      rating_desc: { rating: -1 },
    };

    const sortOption = sortMap[sort] || sortMap.newest;

    // ─────────────────────────────
    // 4. Execute query
    // ─────────────────────────────
    const [products, total] = await Promise.all([
      Product.find(query)
        .populate("brand", "name")
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean(),

      Product.countDocuments(query),
    ]);

    // ─────────────────────────────
    // 5. Response
    // ─────────────────────────────
    return res.status(200).json({
      success: true,
      data: products,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET product by ID ────────────────────────────────────────────────────────

export const getProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    // ─────────────────────────────
    // 1. Validate ObjectId
    // ─────────────────────────────
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // ─────────────────────────────
    // 2. Get product with populate
    // ─────────────────────────────
    const product = await Product.findById(id)
      .populate("brand", "name image")
      .populate("notes.top", "name image family")
      .populate("notes.heart", "name image family")
      .populate("notes.base", "name image family")
      .lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // ─────────────────────────────
    // 3. Get related products (same brand)
    // ✅ FIX 3: after .lean(), populated brand is an object { _id, name, image }
    //           so we access product.brand._id correctly
    // ─────────────────────────────
    const brandId = product.brand?._id ?? product.brand;

    const relatedProducts = await Product.find({
      _id: { $ne: product._id },
      brand: brandId,
      isPublished: true,
    })
      .select("name images variants rating slug")
      .limit(6)
      .lean();

    // ─────────────────────────────
    // 4. Response
    // ─────────────────────────────
    return res.status(200).json({
      success: true,
      data: {
        product,
        relatedProducts,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── CREATE a product ─────────────────────────────────────────────────────────

export const createProduct = async (req, res, next) => {
  const uploadedIds = [];

  try {
    const {
      name,
      brand,
      description,
      variants,
      gender,
      concentration,
      scentType,
      season,
      notes,
      isFeatured,
      isPublished,
    } = req.body;

    // ─────────────────────────────
    // 1. Image files validation
    // ─────────────────────────────
    const imageFiles = (req.files || []).filter(
      (file) => file.fieldname === "images"
    );

    if (!imageFiles.length) {
      // ✅ FIX 4: replaced undefined cleanupUploadedFiles() with deleteImagesByPublicIds()
      // No images were uploaded yet at this point, so nothing to clean up
      return res.status(400).json({
        success: false,
        message: "At least one product image is required",
      });
    }

    // ─────────────────────────────
    // 2. Duplicate product check
    // ─────────────────────────────
    const exists = await Product.exists({ name: name.trim() });

    if (exists) {
      return res.status(409).json({
        success: false,
        message: "Product already exists",
      });
    }

    // ─────────────────────────────
    // 3. Duplicate volume check
    // ─────────────────────────────
    const volumes = variants.map((v) => v.volume);

    if (new Set(volumes).size !== volumes.length) {
      return res.status(400).json({
        success: false,
        message: "Duplicate volume is not allowed",
      });
    }

    // ─────────────────────────────
    // 4. Duplicate notes across levels
    // ─────────────────────────────
    const allNotes = [
      ...(notes.top || []),
      ...(notes.heart || []),
      ...(notes.base || []),
    ];

    if (new Set(allNotes).size !== allNotes.length) {
      return res.status(400).json({
        success: false,
        message: "A note cannot exist in more than one level",
      });
    }

    const noteIds = [...new Set(allNotes)];

    // ─────────────────────────────
    // 5. Validate Brand + Notes exist
    // ─────────────────────────────
    const [brandExists, notesCount] = await Promise.all([
      Brand.exists({ _id: brand }),
      noteIds.length
        ? Note.countDocuments({ _id: { $in: noteIds } })
        : Promise.resolve(0),
    ]);

    if (!brandExists) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    if (noteIds.length && notesCount !== noteIds.length) {
      return res.status(400).json({
        success: false,
        message: "One or more notes do not exist",
      });
    }

    // ─────────────────────────────
    // 6. Upload images
    // ─────────────────────────────
    const images = await uploadMultipleImages(imageFiles);

    uploadedIds.push(...images.map((img) => img.publicId));

    images[0].isPrimary = true;

    // ─────────────────────────────
    // 7. Create product
    // ─────────────────────────────
    let product = await Product.create({
      name: name.trim(),
      brand,
      description: description.trim(),
      variants,
      gender,
      concentration,
      scentType,
      season,
      notes,
      images,
      isFeatured,
      isPublished,
    });

    // ─────────────────────────────
    // 8. Populate references
    // ─────────────────────────────
    product = await product.populate([
      { path: "brand", select: "name image" },
      { path: "notes.top", select: "name image family" },
      { path: "notes.heart", select: "name image family" },
      { path: "notes.base", select: "name image family" },
    ]);

    return res.status(201).json({
      success: true,
      data: product,
      message: "Product created successfully",
    });
  } catch (err) {
    // Rollback uploaded images on any error
    if (uploadedIds.length) {
      await deleteImagesByPublicIds(uploadedIds);
    }

    next(err);
  }
};

// ─── UPDATE a product ─────────────────────────────────────────────────────────

export const updateProduct = async (req, res, next) => {
  const uploadedIds = [];

  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const {
      name,
      brand,
      description,
      variants,
      gender,
      concentration,
      scentType,
      season,
      notes,
      isFeatured,
      isPublished,
      removeImages,
      replaceImages,
    } = req.body;

    // ─────────────────────────────
    // 1. Name — duplicate check
    // ─────────────────────────────
    if (name && name.trim() !== product.name) {
      const exists = await Product.exists({
        _id: { $ne: product._id },
        name: name.trim(),
      });

      if (exists) {
        return res.status(409).json({
          success: false,
          message: "Product already exists",
        });
      }

      product.name = name.trim();
    }

    // ─────────────────────────────
    // 2. Brand — existence check
    // ─────────────────────────────
    if (brand && brand !== product.brand.toString()) {
      const brandExists = await Brand.exists({ _id: brand });

      if (!brandExists) {
        return res.status(404).json({
          success: false,
          message: "Brand not found",
        });
      }

      product.brand = brand;
    }

    // ─────────────────────────────
    // 3. Simple scalar fields
    // ─────────────────────────────
    if (description) product.description = description.trim();
    if (variants) product.variants = variants;
    if (gender) product.gender = gender;
    if (concentration) product.concentration = concentration;
    if (scentType) product.scentType = scentType;
    if (season) product.season = season;
    if (typeof isFeatured !== "undefined") product.isFeatured = isFeatured;
    if (typeof isPublished !== "undefined") product.isPublished = isPublished;

    // ─────────────────────────────
    // 4. Notes — duplicate-across-levels guard
    // ✅ FIX 5: safely fall back to [] to avoid crash on partial notes object
    // ─────────────────────────────
    if (notes) {
      const allNotes = [
        ...(notes.top || []),
        ...(notes.heart || []),
        ...(notes.base || []),
      ];

      if (new Set(allNotes).size !== allNotes.length) {
        return res.status(400).json({
          success: false,
          message: "A note cannot exist in more than one level",
        });
      }

      product.notes = notes;
    }

    // ─────────────────────────────
    // 5. Remove selected images
    // ─────────────────────────────
    const removeImagesArray = Array.isArray(removeImages)
      ? removeImages
      : removeImages
      ? [removeImages]
      : [];

    if (removeImagesArray.length > 0) {
      const remainingImages = product.images.filter(
        (img) => !removeImagesArray.includes(img.publicId)
      );

      if (remainingImages.length === 0 && !(req.files || []).length) {
        return res.status(400).json({
          success: false,
          message: "Product must have at least one image",
        });
      }

      await deleteImagesByPublicIds(removeImagesArray);
      product.images = remainingImages;
    }

    // ─────────────────────────────
    // 6. Upload new images
    // ─────────────────────────────
    const newImageFiles = (req.files || []).filter(
      (file) => file.fieldname === "images"
    );

    if (newImageFiles.length > 0) {
      const newUploaded = await uploadMultipleImages(newImageFiles);

      uploadedIds.push(...newUploaded.map((img) => img.publicId));

      if (replaceImages === "true") {
        const oldPublicIds = product.images.map((img) => img.publicId);
        await deleteImagesByPublicIds(oldPublicIds);
        product.images = newUploaded;
      } else {
        product.images.push(...newUploaded);
      }

      // Ensure one primary image
      const hasPrimary = product.images.some((img) => img.isPrimary);
      if (!hasPrimary && product.images.length > 0) {
        product.images[0].isPrimary = true;
      }
    }

    // ─────────────────────────────
    // 7. Save & populate
    // ─────────────────────────────
    const updatedProduct = await product.save();

    await updatedProduct.populate([
      { path: "brand", select: "name image" },
      { path: "notes.top", select: "name image family" },
      { path: "notes.heart", select: "name image family" },
      { path: "notes.base", select: "name image family" },
    ]);

    return res.status(200).json({
      success: true,
      data: updatedProduct,
      message: "Product updated successfully",
    });
  } catch (err) {
    if (uploadedIds.length > 0) {
      await deleteImagesByPublicIds(uploadedIds);
    }

    return next(err);
  }
};

// ─── DELETE a product ─────────────────────────────────────────────────────────

export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    // ─────────────────────────────
    // 1. Validate ID
    // ─────────────────────────────
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // ─────────────────────────────
    // 2. Find product
    // ─────────────────────────────
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // ─────────────────────────────
    // 3. Collect product image publicIds only
    // ✅ FIX 6: notes is { top, heart, base } (object of ObjectId refs), NOT an array —
    //           notes are separate documents with their own images; don't touch them here
    // ─────────────────────────────
    const publicIds = product.images
      .map((img) => img.publicId)
      .filter(Boolean);

    // ─────────────────────────────
    // 4. Delete images from Cloudinary
    // ─────────────────────────────
    if (publicIds.length > 0) {
      await deleteImagesByPublicIds(publicIds);
    }

    // ─────────────────────────────
    // 5. Delete product
    // ─────────────────────────────
    await Product.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};