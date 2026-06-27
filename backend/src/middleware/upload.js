import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

// ─────────────────────────────────────────────────────────────
// Cloudinary Storages
// ─────────────────────────────────────────────────────────────

const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "avatars",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    transformation: [
      {
        width: 500,
        height: 500,
        crop: "limit",
      },
    ],
  },
});

const brandStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "brands",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      {
        width: 500,
        height: 500,
        crop: "limit",
      },
    ],
  },
});

const noteStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "notes",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      {
        width: 300,
        height: 300,
        crop: "limit",
      },
    ],
  },
});

const productStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "products",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      {
        width: 800,
        height: 800,
        crop: "limit",
      },
    ],
  },
});

// ─────────────────────────────────────────────────────────────
// Common image filter
// ─────────────────────────────────────────────────────────────

const imageFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files are allowed"), false);
  }

  cb(null, true);
};

// ─────────────────────────────────────────────────────────────
// Upload middlewares
// ─────────────────────────────────────────────────────────────

export const uploadAvatar = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: imageFilter,
});

export const uploadBrand = multer({
  storage: brandStorage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: imageFilter,
});

export const uploadNote = multer({
  storage: noteStorage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: imageFilter,
});

export const uploadProduct = multer({
  storage: productStorage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: imageFilter,
}).array("images", 10);