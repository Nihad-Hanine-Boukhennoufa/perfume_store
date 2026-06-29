import instance from "../api/axios";

// Get wishlist
export const getWishlist = async () => {
  const res = await instance.get("/wishlist");
  return res.data.data;
};

// Add to wishlist
export const addToWishlist = async (productId) => {
  const res = await instance.post("/wishlist", { productId });
  return res.data.data;
};

// Remove from wishlist
export const removeFromWishlist = async (productId) => {
  const res = await instance.delete(`/wishlist/${productId}`);
  return res.data.data;
};

// Clear wishlist
export const clearWishlist = async () => {
  const res = await instance.delete("/wishlist");
  return res.data.data;
};
