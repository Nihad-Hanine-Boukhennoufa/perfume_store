import User from "../models/User.js";
import Cart from "../models/Cart.js";
import bcrypt from "bcryptjs";
import { deleteCloudinaryImage } from "../utils/cloudinaryHelper.js";

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", role = "" } = req.query;

    const pageNumber = Math.max(parseInt(page) || 1, 1);
    const limitNumber = Math.min(Math.max(parseInt(limit) || 10, 1), 50);

    const query = {};

    // Search by name or email
    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { name: { $regex: escapedSearch, $options: "i" } },
        { email: { $regex: escapedSearch, $options: "i" } },
      ];
    }

    // Filter by role
    if (role && role !== "all") query.role = role;

    const users = await User.find(query)
      .select("-password")
      .limit(limitNumber)
      .skip((pageNumber - 1) * limitNumber)
      .sort({ createdAt: -1 });

    const count = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: users,
      totalPages: Math.ceil(count / limitNumber),
      currentPage: pageNumber,
      total: count,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      if (req.file) await deleteCloudinaryImage(req.file.filename);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        // If new file was uploaded, clean it up since we're rejecting the request
        if (req.file) await deleteCloudinaryImage(req.file.filename);
        
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }
      user.email = email;
    }

    if (name) user.name = name;

    // Handle image upload
    if (req.file) {
      // Delete old image from Cloudinary if exists
        if (req.file) await deleteCloudinaryImage(req.file.filename);
      user.image = req.file.path;
    }

    // Hash new password if provided
     if (password) user.password = await bcrypt.hash(password, 12);

    await user.save();

    res.status(200).json({
      success: true,
      data: {
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
      },
      message: "User updated successfully",
    });
  } catch (error) {
    // Clean up uploaded file if error occurs
    if (req.file) await deleteCloudinaryImage(req.file.filename);
    
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// Update user role
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.params.id;

    // Prevent admin from changing their own role
    if (userId === req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You cannot change your own role",
      });
    }

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be 'user' or 'admin'",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    // Create cart if switching from admin to user
    if (oldRole === "admin" && role === "user") {
      const existingCart = await Cart.findOne({ userId: user._id });
      if (!existingCart) {
        await Cart.create({
          userId: user._id,
          items: [],
          total: 0,
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
      },
      message: "User role updated successfully",
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent admin from deleting themselves
    if (userId === req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (user.imagePublicId) await deleteCloudinaryImage(user.imagePublicId);

    // Delete associated cart if exists
    await Cart.deleteOne({ userId: user._id });

    // Delete user
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};