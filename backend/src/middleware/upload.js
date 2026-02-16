import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from 'cloudinary';

let storage = null;

const getStorage = () => {
  if (!storage) {
    // Configure cloudinary on first use
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });

    console.log("Initializing Cloudinary storage with:", {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY ? "***" + process.env.CLOUDINARY_API_KEY.slice(-4) : "missing",
      api_secret: process.env.CLOUDINARY_API_SECRET ? "***set" : "missing"
    });
    console.log("API KEY:", process.env.CLOUDINARY_API_KEY);

    storage = new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: "avatars", 
        allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
        transformation: [{ width: 500, height: 500, crop: "limit" }], 
      },
    });
  }
  return storage;
};
console.log("API KEY:", process.env.CLOUDINARY_API_KEY);

const upload = multer({ 
  storage: getStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, 
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

export default upload;