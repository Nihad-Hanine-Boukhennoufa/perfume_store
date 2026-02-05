import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Cart from "../models/Cart.js";

// Register a new user
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || "user"
    });

    await newUser.save();
    console.log("User role saved as:", newUser.role);
    // create an empty cart only for user
    if (!role || newUser.role === "user") {
  const cart = await Cart.create({
    userId: newUser._id,
    items: [],
    total: 0
  });

  console.log("Cart created:", cart);
}

    return res.status(201).json({
      success: true,
      data: { 
        name: newUser.name, 
        email: newUser.email, 
        role: newUser.role 
      },
      message: "User registered successfully",
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};

// Login user
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: "Email and password required" });

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: "User not found" });
    }
    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    res.status(200).json({
      success: true,
      data: { token, user: { name: user.name, email: user.email, role: user.role } },
    });
  } catch (err) {
    next(err);
  }
};