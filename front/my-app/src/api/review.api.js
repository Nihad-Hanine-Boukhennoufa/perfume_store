import instance from "./axios.js";

export const getProductReviews = async (productId, { page = 1, limit = 10, sortBy } = {}) => {
  const params = { page, limit };
  if (sortBy) params.sortBy = sortBy;
  const { data } = await instance.get(`/reviews/product/${productId}`, { params });
  return data;
};

export const addReview = async ({ productId, rating, comment }) => {
  const { data } = await instance.post("/reviews", { productId, rating, comment });
  return data;
};

export const updateReview = async ({ reviewId, rating, comment }) => {
  const { data } = await instance.patch(`/reviews/${reviewId}`, { rating, comment });
  return data;
};

export const deleteReview = async (reviewId) => {
  const { data } = await instance.delete(`/reviews/${reviewId}`);
  return data;
};