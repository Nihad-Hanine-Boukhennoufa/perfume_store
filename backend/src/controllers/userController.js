import User from "../models/User.js";
import Cart from "../models/Cart.js";
import bcrypt from "bcryptjs";
import { deleteCloudinaryImage } from "../utils/cloudinaryHelper.js";

// ----Get all users ----------------------------------------------------

export const getAllUsers = async (req, res, next) => {
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

    const [users, count] = await Promise.all([
      User.find(query)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data:        users,
      total:       count,
      totalPages:  Math.ceil(count / limitNumber),
      currentPage: pageNumber,
    });
  } catch (err) {
    next(err);
  }
};

// ---- Get user by ID ----------------------------------------------------

export const getUserById = async (req, res, next) => {
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
  } catch (err) {
    next(err);
  }
};

// ---- Update user ----------------------------------------------------

export const updateUser = async (req, res, next) => {
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

    if (!name && !email && !password && !req.file) {
      return res.status(400).json({
        success: false,
        message: "No data provided to update",
      });
    }

    if (email && email !== user.email) {
      const taken = await User.findOne({ email });
      if (taken) {
        if (req.file) await deleteCloudinaryImage(req.file.filename);
        return res.status(409).json({ success: false, message: "Email already exists" });
      }
      user.email = email;
    }

    if (name)     user.name     = name;
    if (password) user.password = await bcrypt.hash(password, 12);

    if (req.file) {
      if (user.imagePublicId) await deleteCloudinaryImage(user.imagePublicId);
      user.image         = req.file.path;
      user.imagePublicId = req.file.filename;
    }

    await user.save();

    res.status(200).json({
      success: true,
      data:    { 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        image: user.image 
      },
      message: "User updated successfully",
    });
  } catch (err) {
    if (req.file) await deleteCloudinaryImage(req.file.filename);
    next(err);
  }
};

// ---- Update user role ----------------------------------------------------

export const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const userId   = req.params.id;

    if (userId === req.user.id) {
      return res.status(403).json({ success: false, message: "You cannot change your own role" });
    }

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ success: false, message: "Role must be 'user' or 'admin'" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const oldRole = user.role;
    user.role = role;
    await user.save();

    if (oldRole === "admin" && role === "user") {
      const exists = await Cart.findOne({ userId: user._id });
      if (!exists) await Cart.create({ userId: user._id, items: [], total: 0 });
    }

    res.status(200).json({
      success: true,
      data:    { name: user.name, email: user.email, role: user.role, image: user.image },
      message: "User role updated successfully",
    });
  } catch (err) {
    next(err);
  }
};

// ---- Delete user ----------------------------------------------------

export const deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id;

    if (userId === req.user.id) {
      return res.status(403).json({ success: false, message: "You cannot delete your own account" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (user.imagePublicId) await deleteCloudinaryImage(user.imagePublicId);
    await Promise.all([
      Cart.deleteOne({ userId: user._id }),
      User.findByIdAndDelete(userId),
    ]);

    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    next(err);
  }
};

// ---- Update current user's own profile ----------------------------------------------------

export const updateMe = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (!name && !email && !req.file) {
      return res.status(400).json({ success: false, message: "No data provided" });
    }

    if (email && email !== user.email) {
      const taken = await User.findOne({ email });
      if (taken) {
        if (req.file) await deleteCloudinaryImage(req.file.filename);
        return res.status(409).json({ success: false, message: "Email already exists" });
      }
      user.email = email;
    }

    if (name) user.name = name;

    if (req.file) {
      if (user.imagePublicId) await deleteCloudinaryImage(user.imagePublicId);
      user.image         = req.file.path;
      user.imagePublicId = req.file.filename;
    }

    await user.save();

    res.status(200).json({
      success: true,
      data:    { name: user.name, email: user.email, role: user.role, image: user.image },
      message: "Profile updated successfully",
    });
  } catch (err) {
    if (req.file) await deleteCloudinaryImage(req.file.filename);
    next(err);
  }
};