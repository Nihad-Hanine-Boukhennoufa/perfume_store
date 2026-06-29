import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
} from "../api/wishlist.api";
import { useAuth } from "./useAuth";

export const useWishlist = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const isUser = !!user && user.role === "user";

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["wishlist"] });

  // Full wishlist data (for Wishlist page)
  const wishlistQuery = useQuery({
    queryKey: ["wishlist"],
    queryFn:  getWishlist,
    enabled:  isUser,
  });

  const addItem = useMutation({
    mutationFn: addToWishlist,      // productId (string)
    onSuccess:  invalidate,
  });

  const removeItem = useMutation({
    mutationFn: removeFromWishlist, // productId (string)
    onSuccess:  invalidate,
  });

  const clear = useMutation({
    mutationFn: clearWishlist,
    onSuccess:  invalidate,
  });

  // Helper — check if a product is already in wishlist
  const isInWishlist = (productId) =>
    (wishlistQuery.data ?? []).some(
      (item) => item.productId?._id === productId || item.productId === productId
    );

  return {
    items:      wishlistQuery.data ?? [],
    itemCount:  wishlistQuery.data?.length ?? 0,
    isLoading:  wishlistQuery.isLoading,
    isError:    wishlistQuery.isError,
    isInWishlist,
    addItem,
    removeItem,
    clear,
  };
};