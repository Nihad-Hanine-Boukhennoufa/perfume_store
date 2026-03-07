import { deleteCloudinaryImage } from "../utils/cloudinaryHelper.js";

/**
 * Transform multer files into product image objects
 */
export const uploadMultipleImages = (files = []) => {
    if (!files?.length) return [];
    return files.map(file => ({
        url: file.path,
        publicId: file.filename,
    }));
};

/**
 * Delete multiple Cloudinary images by publicIds.
 * Errors are caught per-image to avoid a single failure aborting the rest.
 */
export const deleteImagesByPublicIds = async (publicIds = []) => {
    if (!Array.isArray(publicIds) || publicIds.length === 0) return;

    await Promise.allSettled(
        publicIds.map(id => deleteCloudinaryImage(id))
    );
};

/**
 * Replace all product images:
 * 1. Delete old images from Cloudinary
 * 2. Return transformed new images array
 */
export const replaceAllImages = async (oldImages = [], newFiles = []) => {
    const oldPublicIds = oldImages.map(img => img.publicId).filter(Boolean);
    await deleteImagesByPublicIds(oldPublicIds);
    return uploadMultipleImages(newFiles);
};