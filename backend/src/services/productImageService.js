import { deleteCloudinaryImage } from "../utils/cloudinaryHelper.js";

/**
 * Transform multer files into Product image objects
 */
export const uploadProductImages = (files = []) => {
  if (!files.length) {
    return {
      images: [],
      uploadedIds: [],
    };
  }

  const images = files.map((file) => ({
    url: file.path,
    publicId: file.filename,
    isPrimary: false,
  }));

  return {
    images,
    uploadedIds: images.map((image) => image.publicId),
  };
};

/**
 * Delete multiple Cloudinary images
 */
export const deleteImagesByPublicIds = async (publicIds = []) => {
  if (!publicIds.length) return;

  await Promise.allSettled(
    publicIds.map((id) => deleteCloudinaryImage(id))
  );
};

/**
 * Ensure exactly one primary image exists
 */
export const ensurePrimaryImage = (images = []) => {
  if (!images.length) return;

  let primaryFound = false;

  for (const image of images) {
    if (image.isPrimary && !primaryFound) {
      primaryFound = true;
    } else {
      image.isPrimary = false;
    }
  }

  if (!primaryFound) {
    images[0].isPrimary = true;
  }
};

/**
 * Append new images to product
 */
export const appendProductImages = (product, files = []) => {
  const { images, uploadedIds } = uploadProductImages(files);

  if (!images.length) {
    return [];
  }

  product.images.push(...images);

  ensurePrimaryImage(product.images);

  return uploadedIds;
};

/**
 * Remove selected images
 */
export const removeProductImages = async (
  product,
  publicIds = []
) => {
  if (!publicIds.length) return;

  await deleteImagesByPublicIds(publicIds);

  product.images = product.images.filter(
    (image) => !publicIds.includes(image.publicId)
  );

  ensurePrimaryImage(product.images);
};

/**
 * Replace all product images
 */
export const replaceProductImages = async (
  product,
  files = []
) => {
  await deleteImagesByPublicIds(
    product.images.map((image) => image.publicId)
  );

  const { images, uploadedIds } = uploadProductImages(files);

  product.images = images;

  ensurePrimaryImage(product.images);

  return uploadedIds;
};