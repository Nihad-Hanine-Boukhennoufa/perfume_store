import instance from "./axios";

export const getDashboardStats = async () => {
  const { data } = await instance.get("/admin/dashboard");
  return data.data;
};