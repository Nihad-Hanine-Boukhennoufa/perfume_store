import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "../api/cart.api";
import { useAuth } from "./useAuth";

export const useCart = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const isUser = !!user && user.role === "user";

  // ── Queries ────────────────────────────────────────────────────────────────
  const cartQuery = useQuery({
    queryKey: ["cart"],
    queryFn:  getCart,
    enabled:  isUser,
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["cart"] });

  const addItem = useMutation({
    mutationFn: addToCart,       // { productId, volume, quantity }
    onSuccess:  invalidate,
  });

  const updateItem = useMutation({
    mutationFn: updateCartItem,  // { productId, volume, quantity }
    onSuccess:  invalidate,
  });

  const removeItem = useMutation({
    mutationFn: removeFromCart,  // { productId, volume }
    onSuccess:  invalidate,
  });

  const clear = useMutation({
    mutationFn: clearCart,
    onSuccess:  invalidate,
  });

  return {
    // data
    cart:      cartQuery.data,
    items:     cartQuery.data?.items ?? [],
    total:     cartQuery.data?.total ?? 0,
    itemCount: cartQuery.data?.items?.length ?? 0,

    // state
    isLoading: cartQuery.isLoading,
    isError:   cartQuery.isError,

    // mutations
    addItem,
    updateItem,
    removeItem,
    clear,
  };
};