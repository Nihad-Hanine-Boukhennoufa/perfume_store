import instance from "./axios.js";

export const getAllBrands = async () => {
  const { data } = await instance.get("/brands");
  return data.data;
};

export const createBrand = async (formData) => {
  const { data } = await instance.post("/brands", formData);
  return data.data;
};

export const updateBrand = async ({ id, formData }) => {
  const { data } = await instance.put(`/brands/${id}`, formData);
  return data.data;
};

export const deleteBrand = async (id) => {
  const { data } = await instance.delete(`/brands/${id}`);
  return data;
};