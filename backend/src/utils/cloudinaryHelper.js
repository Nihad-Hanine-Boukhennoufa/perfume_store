import cloudinary from "../config/cloudinary.js";

export const deleteCloudinaryImage = async (publicId) => {
  if (!publicId) return false;
  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (err) {
    console.error(`[Cloudinary] Failed to delete image "${publicId}":`, err.message);
    return false;
  }
};

export const deleteCloudinaryImages = async (publicIds = []) => {
  if (!publicIds.length) return;
  await Promise.allSettled(publicIds.map(deleteCloudinaryImage));
};