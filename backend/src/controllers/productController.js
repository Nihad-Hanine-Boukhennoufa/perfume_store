import Product from '../models/Product.js';
import { deleteImagesByPublicIds, uploadMultipleImages, replaceAllImages } from "../services/productImageService.js";

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

    // Search (name)
    if (search) {
      query.name = {
        $regex: search.trim(),
        $options: "i",
      };
    }

    // Filters
    if (brand) query.brand = brand;
    if (gender) query.gender = gender;
    if (concentration) query.concentration = concentration;

    if (season) {
      query.season = {
        $in: Array.isArray(season) ? season : [season],
      };
    }

    // Price filter (inside variants)
    if (minPrice || maxPrice) {
      query["variants.price"] = {};

      if (minPrice) query["variants.price"].$gte = Number(minPrice);
      if (maxPrice) query["variants.price"].$lte = Number(maxPrice);
    }

    // Rating filter
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
    // ─────────────────────────────
    const relatedProducts = await Product.find({
      _id: { $ne: product._id },
      brand: product.brand._id,
      isPublished: true,
    })
      .select("name images variants rating")
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

// ─── CREATE a product ────────────────────────────────────────────────────
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

    // Product images
    const imageFiles = (req.files || []).filter(
      (file) => file.fieldname === "images"
    );

    if (!imageFiles.length) {
      await cleanupUploadedFiles(req.files);

      return res.status(400).json({
        success: false,
        message: "At least one product image is required",
      });
    }

    // Check duplicate product
    const exists = await Product.exists({
      name: name.trim(),
    });

    if (exists) {
      await cleanupUploadedFiles(req.files);

      return res.status(409).json({
        success: false,
        message: "Product already exists",
      });
    }

    // Prevent duplicate volumes
    const volumes = variants.map((variant) => variant.volume);

    if (new Set(volumes).size !== volumes.length) {
      await cleanupUploadedFiles(req.files);

      return res.status(400).json({
        success: false,
        message: "Duplicate volume is not allowed",
      });
    }

    // Prevent the same note from existing in multiple levels
    const allNotes = [
      ...notes.top,
      ...notes.heart,
      ...notes.base,
    ];

    if (new Set(allNotes).size !== allNotes.length) {
      await cleanupUploadedFiles(req.files);

      return res.status(400).json({
        success: false,
        message: "A note cannot exist in more than one level",
      });
    }

    const noteIds = [...new Set(allNotes)];

    // Check Brand + Notes in parallel
    const [brandExists, notesCount] = await Promise.all([
      Brand.exists({
        _id: brand,
      }),

      noteIds.length
        ? Note.countDocuments({
            _id: {
              $in: noteIds,
            },
          })
        : Promise.resolve(0),
    ]);

    if (!brandExists) {
      await cleanupUploadedFiles(req.files);

      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    if (noteIds.length && notesCount !== noteIds.length) {
      await cleanupUploadedFiles(req.files);

      return res.status(400).json({
        success: false,
        message: "One or more notes do not exist",
      });
    }

    // Upload product images
    const images = await uploadMultipleImages(imageFiles);

    uploadedIds.push(...images.map((image) => image.publicId));

    images[0].isPrimary = true;

    // Create product
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

    // Populate references
    product = await product.populate([
      {
        path: "brand",
        select: "name image",
      },
      {
        path: "notes.top",
        select: "name image family",
      },
      {
        path: "notes.heart",
        select: "name image family",
      },
      {
        path: "notes.base",
        select: "name image family",
      },
    ]);

    return res.status(201).json({
      success: true,
      data: product,
      message: "Product created successfully",
    });

  } catch (err) {
    // Rollback uploaded images
    if (uploadedIds.length) {
      await deleteImagesByPublicIds(uploadedIds);
    }

    next(err);
  }
};

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
    // 1. Check duplicate name (if changed)
    // ─────────────────────────────
    if (name && name !== product.name) {
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
    // 2. Check brand (if changed)
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
    // 3. Description
    // ─────────────────────────────
    if (description) {
      product.description = description.trim();
    }

    // ─────────────────────────────
    // 4. Variants (with volume validation)
    // ─────────────────────────────
    if (variants) {
      product.variants = variants;
    }

    // ─────────────────────────────
    // 5. Simple fields
    // ─────────────────────────────
    if (gender) product.gender = gender;
    if (concentration) product.concentration = concentration;
    if (scentType) product.scentType = scentType;
    if (season) product.season = season;
    if (typeof isFeatured !== "undefined") product.isFeatured = isFeatured;
    if (typeof isPublished !== "undefined") product.isPublished = isPublished;

    // ─────────────────────────────
    // 6. Notes validation (prevent duplicates across levels)
    // ─────────────────────────────
    if (notes) {
      const allNotes = [
        ...notes.top,
        ...notes.heart,
        ...notes.base,
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
    // 7. Handle removeImages
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

      // Prevent deleting all images
      if (remainingImages.length === 0 && (!req.files || !req.files.length)) {
        return res.status(400).json({
          success: false,
          message: "Product must have at least one image",
        });
      }

      product.images = remainingImages;

      await deleteImagesByPublicIds(removeImagesArray);
    }

    // ─────────────────────────────
    // 8. Handle new uploaded images
    // ─────────────────────────────
    const newImageFiles = (req.files || []).filter(
      (file) => file.fieldname === "images"
    );

    let newUploaded = [];

    if (newImageFiles.length > 0) {
      newUploaded = await uploadMultipleImages(newImageFiles);

      uploadedIds.push(...newUploaded.map((img) => img.publicId));

      // If replacing mode is ON
      if (replaceImages === "true") {
        const oldPublicIds = product.images.map((img) => img.publicId);

        await deleteImagesByPublicIds(oldPublicIds);

        product.images = newUploaded;

      } else {
        // append mode
        product.images.push(...newUploaded);
      }

      // Ensure at least one primary image
      const hasPrimary = product.images.some((img) => img.isPrimary);

      if (!hasPrimary && product.images.length > 0) {
        product.images[0].isPrimary = true;
      }
    }
    // ─────────────────────────────
    // 9. Save product
    // ─────────────────────────────
    const updatedProduct = await product.save();

    // ─────────────────────────────
    // 10. Populate (optional but recommended)
    // ─────────────────────────────
    await updatedProduct.populate("brand", "name");

    // await updatedProduct.populate("notes.top notes.heart notes.base");

    // ─────────────────────────────
    // 11. Success response
    // ─────────────────────────────
    return res.status(200).json({
      success: true,
      data: updatedProduct,
      message: "Product updated successfully",
    });

  } catch (err) {
    // ─────────────────────────────
    // 12. Rollback uploaded images on error
    // ─────────────────────────────
    if (uploadedIds.length > 0) {
      await deleteImagesByPublicIds(uploadedIds);
    }

    return next(err);
  }
};

// ─── DELETE a product ────────────────────────────────────────────────────
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
    // 3. Collect all image publicIds
    // ─────────────────────────────
    const productImages = product.images
      ?.map((img) => img.publicId)
      .filter(Boolean) || [];

    const noteImages = product.notes
      ?.flatMap((n) => n.image?.publicId ? [n.image.publicId] : [])
      .filter(Boolean) || [];

    const allPublicIds = [...productImages, ...noteImages];

    // ─────────────────────────────
    // 4. Delete images FIRST (safety step)
    // ─────────────────────────────
    if (allPublicIds.length > 0) {
      await deleteImagesByPublicIds(allPublicIds);
    }

    // ─────────────────────────────
    // 5. Delete product
    // ─────────────────────────────
    await Product.findByIdAndDelete(id);

    // ─────────────────────────────
    // 6. Success response
    // ─────────────────────────────
    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });

  } catch (err) {
    // ─────────────────────────────
    // 7. Error handling (no partial state risk here)
    // ─────────────────────────────
    next(err);
  }
};