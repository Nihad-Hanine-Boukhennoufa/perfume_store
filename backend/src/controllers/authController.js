import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Cart from "../models/Cart.js";
import { deleteCloudinaryImage } from "../utils/cloudinaryHelper.js";

// Register a new user
export const register = async (req, res, next) => {
  try {
    console.log("=== REGISTER REQUEST ===");
    console.log("Body:", req.body);
    console.log("File:", req.file);
    console.log("=======================");

    const { name, email, password, role } = req.body;

    // Validation
    if (!name || !email || !password) {
      console.log("Validation failed: Missing required fields");
      if (req.file) await deleteCloudinaryImage(req.file.filename);
      return res.status(400).json({ 
        success: false, 
        message: "Name, email, and password are required" 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("User already exists:", email);
      if (req.file) await deleteCloudinaryImage(req.file.filename);
      
      return res.status(400).json({ 
        success: false, 
        message: "Email already exists" 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Get Cloudinary image URL and public_id if file was uploaded
    const imagePath = req.file ? req.file.path : null;
    const imagePublicId = req.file ? req.file.filename : null;

    console.log("Creating user with:", {
      name,
      email,
      role: role || "user",
      hasImage: !!imagePath,
      imagePath,
      imagePublicId
    });

    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || "user",
      image: imagePath,
      imagePublicId: imagePublicId,
    });

    await newUser.save();
    console.log("User created successfully:", newUser._id);
    
    // Create an empty cart only for users (not admins)
    if (newUser.role === "user") {
      const cart = await Cart.create({
        userId: newUser._id,
        items: [],
        total: 0
      });
      console.log("Cart created:", cart._id);
    }

    return res.status(201).json({
      success: true,
      data: { 
        name: newUser.name, 
        email: newUser.email, 
        role: newUser.role,
        image: newUser.image,
      },
      message: "User registered successfully",
    });

  } catch (err) {
    // If error occurs and file was uploaded, clean up Cloudinary
    if (req.file) {
      await deleteCloudinaryImage(req.file.filename);
    }
    
    console.error("=== REGISTRATION ERROR ===");
    console.error("Error:", err);
    console.error("Error message:", err.message);
    console.error("Error name:", err.name);
    console.error("=========================");
    
    res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};

// Login user - keep as is
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Email and password required" 
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
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
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};