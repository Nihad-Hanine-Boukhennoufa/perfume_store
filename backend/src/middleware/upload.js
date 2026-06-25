import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Storages ─────────────────────────────────────────────────────────────────

const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "avatars",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    transformation: [{ width: 500, height: 500, crop: "limit" }],
  },
});

const brandStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "brands",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 500, height: 500, crop: "limit" }],
  },
});

const productStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "products",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 800, height: 800, crop: "limit" }],
  },
});

// ─── Multer instances ─────────────────────────────────────────────────────────

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Only image files are allowed!"), false);
};

export const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter,
});

export const uploadBrand = multer({
  storage: brandStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter,
});

const productMulter = multer({
  storage: productStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: imageFilter,
});

// ─── Product upload middleware ────────────────────────────────────────────────
//
// Accepts:
//   images        — product images (up to 10)
//   noteImage_0   — image for note at index 0
//   noteImage_1   — image for note at index 1
//   … up to noteImage_9
//
// upload.fields() puts files in req.files as an object map:
//   { images: [file, ...], noteImage_0: [file], ... }
//
// normalizeFiles (below) flattens it to a plain array so the controller
// can filter by f.fieldname, consistent with how upload.array() works.

export const uploadProduct = productMulter.fields([
  { name: "images",      maxCount: 10 },
  { name: "noteImage_0", maxCount: 1  },
  { name: "noteImage_1", maxCount: 1  },
  { name: "noteImage_2", maxCount: 1  },
  { name: "noteImage_3", maxCount: 1  },
  { name: "noteImage_4", maxCount: 1  },
  { name: "noteImage_5", maxCount: 1  },
  { name: "noteImage_6", maxCount: 1  },
  { name: "noteImage_7", maxCount: 1  },
  { name: "noteImage_8", maxCount: 1  },
  { name: "noteImage_9", maxCount: 1  },
]);

// Flatten the fields() object map → flat array so req.files works the same
// as it did with upload.array()
export const normalizeFiles = (req, _res, next) => {
  if (req.files && !Array.isArray(req.files)) {
    req.files = Object.values(req.files).flat();
  }
  next();
};