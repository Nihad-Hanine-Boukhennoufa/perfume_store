import instance from "../api/axios";

export const getDashboardStats = async () => {
  const { data } = await instance.get("/admin/dashboard");
  return data.data;
};