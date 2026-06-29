import { useQuery } from "@tanstack/react-query";
import { getProducts, getProduct } from "../api/product.api";

// ── useProducts — paginated + filtered list ───────────────────────────────────
export const useProducts = ({ page = 1, limit = 12, search = "", filters = {} } = {}) => {
  return useQuery({
    queryKey: ["products", { page, limit, search, ...filters }],
    queryFn:  () => getProducts(page, limit, search, filters),
    keepPreviousData: true, // smooth pagination — keeps old data while fetching next page
  });
};

// ── useProductDetails — single product by ID ──────────────────────────────────
export const useProductDetails = (id) => {
  return useQuery({
    queryKey: ["product", id],
    queryFn:  () => getProduct(id),
    enabled:  !!id,
  });
};