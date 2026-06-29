import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProductReviews,
  addReview,
  updateReview,
  deleteReview,
} from "../api/review.api";

export const useProductReviews = (productId, { page = 1, limit = 10, sortBy } = {}) => {
  return useQuery({
    queryKey: ["reviews", productId, { page, limit, sortBy }],
    queryFn:  () => getProductReviews(productId, { page, limit, sortBy }),
    enabled:  !!productId,
  });
};

export const useAddReview = (productId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addReview, // { productId, rating, comment }
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
      queryClient.invalidateQueries({ queryKey: ["product", productId] }); // refresh rating
    },
  });
};

export const useUpdateReview = (productId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateReview, // { reviewId, rating, comment }
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["reviews", productId] }),
  });
};

export const useDeleteReview = (productId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteReview, // reviewId
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
    },
  });
};