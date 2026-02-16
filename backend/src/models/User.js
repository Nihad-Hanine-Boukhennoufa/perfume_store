import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user", },
  image: { type: String, default: null },
  imagePublicId: { type: String, default: null },
}, { timestamps: true });

export default mongoose.model("User", userSchema);
