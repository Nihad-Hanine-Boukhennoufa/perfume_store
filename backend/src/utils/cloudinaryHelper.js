import { v2 as cloudinary } from 'cloudinary';

/**
 * Deletes an image from Cloudinary
 * @param {string} publicId - The public_id of the image in Cloudinary
 */
export const deleteCloudinaryImage = async (publicId) => {
  if (!publicId) return;

  try {
    // Ensure cloudinary is configured
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
    
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Error deleting Cloudinary image:", err);
  }
};