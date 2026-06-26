import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true, select: false, },
  role: { type: String, enum: ["user", "admin"], default: "user", },
  image: { type: String, default: null },
  imagePublicId: { type: String, default: null },
}, { timestamps: true });

userSchema.index({ email: 1 });

export default mongoose.model("User", userSchema);
