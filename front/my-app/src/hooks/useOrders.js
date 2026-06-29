import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMyOrders,
  createOrder,
  cancelOrder,
  adminGetAllOrders,
  adminUpdateOrderStatus,
  adminDeleteOrder,
} from "../api/order.api";
import { useAuth } from "./useAuth";

// ── useMyOrders — current user's orders ──────────────────────────────────────
export const useMyOrders = (status) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["myOrders", status],
    queryFn:  () => getMyOrders(status),
    enabled:  !!user,
  });
};

// ── useCreateOrder ────────────────────────────────────────────────────────────
export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      // Refresh orders list and cart after placing an order
      queryClient.invalidateQueries({ queryKey: ["myOrders"] });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
};

// ── useCancelOrder ────────────────────────────────────────────────────────────
export const useCancelOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelOrder, // orderId
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["myOrders"] }),
  });
};

// ── Admin hooks ───────────────────────────────────────────────────────────────

export const useAdminOrders = (status) => {
  return useQuery({
    queryKey: ["adminOrders", status],
    queryFn:  () => adminGetAllOrders({ status }),
  });
};

export const useAdminUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminUpdateOrderStatus, // { orderId, newStatus }
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["adminOrders"] }),
  });
};

export const useAdminDeleteOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminDeleteOrder, // orderId
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["adminOrders"] }),
  });
};