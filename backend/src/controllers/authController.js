import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Cart from "../models/Cart.js";
import { deleteCloudinaryImage } from "../utils/cloudinaryHelper.js";

// ---- Register a new user ----------------------------------------------------

export const register = async (req, res, next) => {
  try {

    const { name, email, password } = req.body;

    // Validation
     if (!name || !email || !password) {
      if (req.file) await deleteCloudinaryImage(req.file.filename);
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (req.file) await deleteCloudinaryImage(req.file.filename);
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
     const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "user",
      image:         req.file?.path     || null,
      imagePublicId: req.file?.filename || null,
    });

await Cart.create({ userId: newUser._id, items: [], total: 0 });

    return res.status(201).json({
      success: true,
      data: {
        name:  newUser.name,
        email: newUser.email,
        role:  newUser.role,
        image: newUser.image,
      },
      message: "User registered successfully",
    });

  } catch (err) {
    if (req.file) await deleteCloudinaryImage(req.file.filename);
    next(err);
  }
};

// ---- Login user ----------------------------------------------------

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Email and password are required" 
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      success: true,
      data: { 
        token, 
        user: { 
          name: user.name, 
          email: user.email, 
          role: user.role,
          image: user.image, 
        } 
      },
    });

  } catch (err) {
    next(err);
  }
};