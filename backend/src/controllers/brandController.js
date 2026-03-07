import Brand from "../models/brandModel.js";
import { deleteCloudinaryImage } from "../utils/cloudinaryHelper.js";

// =====================
// Create Brand
// =====================
export const createBrand = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
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

    const brand = await Brand.create({
      name,
      image: req.file.path,          // Cloudinary URL
      imagePublicId: req.file.filename, // Cloudinary public_id
    });

    res.status(201).json({
      success: true,
      data: brand,
      message: "Brand created successfully",
    });

  } catch (error) {
    if (req.file) await deleteCloudinaryImage(req.file.filename);

    console.error("Create brand error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// =====================
// Get All Brands
// =====================
export const getAllBrands = async (req, res) => {
  try {
    const brands = await Brand.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: brands,
    });
  } catch (error) {
    console.error("Get brands error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// =====================
// Get Brand By ID
// =====================
export const getBrandById = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);

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

  } catch (error) {
    console.error("Get brand error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// =====================
// Update Brand
// =====================
export const updateBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);

    if (!brand) {
      if (req.file) await deleteCloudinaryImage(req.file.filename);
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    const { name } = req.body;

    if (name) brand.name = name;

    // If new image uploaded
    if (req.file) {
      // Delete old image
      if (brand.imagePublicId) {
        await deleteCloudinaryImage(brand.imagePublicId);
      }

      brand.image = req.file.path;
      brand.imagePublicId = req.file.filename;
    }

    await brand.save();

    res.status(200).json({
      success: true,
      data: brand,
      message: "Brand updated successfully",
    });

  } catch (error) {
    if (req.file) await deleteCloudinaryImage(req.file.filename);

    console.error("Update brand error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
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

  } catch (error) {
    console.error("Delete brand error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};