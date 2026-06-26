import Brand from "../models/Brand.js";
import { deleteCloudinaryImage } from "../utils/cloudinaryHelper.js";

// =====================
// Create Brand
// =====================
export const createBrand = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      if (req.file) await deleteCloudinaryImage(req.file.filename);

      return res.status(400).json({
        success: false,
        message: "Brand name is required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Brand image is required",
      });
    }

    const exists = await Brand.findOne({
      name: name.trim(),
    });

    if (exists) {
      if (req.file) await deleteCloudinaryImage(req.file.filename);

      return res.status(409).json({
        success: false,
        message: "Brand already exists",
      });
    }

    const brand = await Brand.create({
      name,
      image: req.file.path,
      imagePublicId: req.file.filename,
    });

    res.status(201).json({
      success: true,
      data: {
        _id: brand._id,
        name: brand.name,
        image: brand.image,
      },
      message: "Brand created successfully",
    });

  } catch (err) {
    if (req.file) await deleteCloudinaryImage(req.file.filename);
    next(err);
  }
};

// =====================
// Get All Brands
// =====================
export const getAllBrands = async (req, res, next) => {
  try {
    const brands = await Brand.find()
      .select("-imagePublicId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: brands,
    });
  } catch (err) {
    next(err);
  }
};

// =====================
// Get Brand By ID
// =====================
export const getBrandById = async (req, res, next) => {
  try {
    const brand = await Brand.findById(req.params.id)
      .select("-imagePublicId");

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    res.status(200).json({
      success: true,
      data: brand,
    });
  } catch (err) {
    next(err);
  }
};

// =====================
// Update Brand
// =====================
export const updateBrand = async (req, res, next) => {
  try {
    const { name } = req.body;

    const brand = await Brand.findById(req.params.id);

    if (!brand) {
      if (req.file) await deleteCloudinaryImage(req.file.filename);

      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    if (!name && !req.file) {
      return res.status(400).json({
        success: false,
        message: "No data provided",
      });
    }

    if (name !== undefined && !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Brand name cannot be empty",
      });
    }

    if (name && name.trim() !== brand.name) {
      const exists = await Brand.findOne({
        name: name.trim(),
      });

      if (exists) {
        if (req.file) await deleteCloudinaryImage(req.file.filename);

        return res.status(409).json({
          success: false,
          message: "Brand already exists",
        });
      }

      brand.name = name.trim();
    }

    if (req.file) {
      if (brand.imagePublicId) {
        await deleteCloudinaryImage(brand.imagePublicId);
      }

      brand.image = req.file.path;
      brand.imagePublicId = req.file.filename;
    }

    await brand.save();

    res.status(200).json({
      success: true,
      data: {
        _id: brand._id,
        name: brand.name,
        image: brand.image,
      },
      message: "Brand updated successfully",
    });
  } catch (err) {
    if (req.file) await deleteCloudinaryImage(req.file.filename);
    next(err);
  }
};

// =====================
// Delete Brand
// =====================
export const deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    // Delete image from Cloudinary
    if (brand.imagePublicId) {
      await deleteCloudinaryImage(brand.imagePublicId);
    }

    await Brand.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Brand deleted successfully",
    });

  } catch (err) {
    next(err);
  }
};