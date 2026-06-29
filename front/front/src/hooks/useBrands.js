import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
} from "../api/brand.api";

export const useBrands = () => {
  return useQuery({
    queryKey: ["brands"],
    queryFn:  getAllBrands,
  });
};

export const useBrand = (id) => {
  return useQuery({
    queryKey: ["brand", id],
    queryFn:  () => getBrandById(id),
    enabled:  !!id,
  });
};

export const useCreateBrand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBrand, // FormData
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["brands"] }),
  });
};

export const useUpdateBrand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateBrand, // { id, formData }
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["brands"] }),
  });
};

export const useDeleteBrand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteBrand, // id
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["brands"] }),
  });
};