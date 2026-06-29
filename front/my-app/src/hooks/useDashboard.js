import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "../api/admin.api";

export const useDashboard = () => {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn:  getDashboardStats,
    staleTime: 2 * 60 * 1000, // refresh every 2 minutes
  });
};