import instance from "./axios.js";

// Get user cart
export const getCart = async () => {
  const { data } = await instance.get("/cart");
  return data.data;
};

// ✅ FIX: volume is required — backend needs it to identify the variant
export const addToCart = async ({ productId, volume, quantity }) => {
  const { data } = await instance.post("/cart", { productId, volume, quantity });
  return data.data;
};

// ✅ FIX: volume is required to identify which variant to update
export const updateCartItem = async ({ productId, volume, quantity }) => {
  const { data } = await instance.put(`/cart/${productId}`, { volume, quantity });
  return data.data;
};

// ✅ FIX: volume sent as query param (DELETE has no body by convention)
export const removeFromCart = async ({ productId, volume }) => {
  const { data } = await instance.delete(`/cart/${productId}`, {
    params: { volume },
  });
  return data.data;
};

// Clear all items
export const clearCart = async () => {
  const { data } = await instance.delete("/cart");
  return data.data;
};