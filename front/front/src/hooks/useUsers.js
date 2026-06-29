import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  getMe,
  updateMe,
  changePassword,
} from "../api/user.api";

// ── Admin ─────────────────────────────────────────────────────────────────────

export const useUsers = ({ page = 1, limit = 10, search = "", role = "" } = {}) => {
  return useQuery({
    queryKey: ["users", { page, limit, search, role }],
    queryFn:  () => getAllUsers({ page, limit, search, role }),
  });
};

export const useUser = (id) => {
  return useQuery({
    queryKey: ["user", id],
    queryFn:  () => getUserById(id),
    enabled:  !!id,
  });
};

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUserRole, // { userId, role }
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUser, // userId
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
};

// ── Current user (profile) ────────────────────────────────────────────────────

export const useMe = () => {
  return useQuery({
    queryKey: ["me"],
    queryFn:  getMe,
  });
};

export const useUpdateMe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMe, // FormData
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["me"] }),
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: changePassword, // { currentPassword, newPassword }
  });
};