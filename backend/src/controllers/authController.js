import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Register a new user
export const register = async (req , res) => {
    try {
        const { name , email , password , isAdmin} = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if(existingUser) {
            return  res.status(400).json({ message: "User already exists" });
        }
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = new User({ name, email, password: hashedPassword, isAdmin });
        await newUser.save();
        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Login user
export const login = async (req , res) => {
    try {
        const { email , password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if(!user) {
            return res.status(400).json({ message: "User not found" });
        }
        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        // Generate JWT token
          const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
        res.status(200).json({ token, user: { name: user.name, email: user.email, isAdmin: user.isAdmin } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}