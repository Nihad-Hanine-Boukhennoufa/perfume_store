import instance from "../api/axios";


  // Get all products with pagination
  export const getProducts = async (page = 1, limit = 12, search = "", filters = {}) => {
  const params = { page, limit };
  if (search)                params.search        = search;
  if (filters.gender)        params.gender        = filters.gender;
  if (filters.concentration) params.concentration = filters.concentration;
  if (filters.season)        params.season        = filters.season;
  if (filters.scentType)     params.scentType     = filters.scentType;
  if (filters.minPrice)      params.minPrice      = filters.minPrice;
  if (filters.maxPrice)      params.maxPrice      = filters.maxPrice;
  if (filters.sort)          params.sort          = filters.sort;
 
  const response = await instance.get("/products", { params });
  return response.data;
};

  // Get single product by ID
  export const getProduct = async (id) => {
    const response = await instance.get(`/products/${id}`);
    return response.data;
  };

  // Create new product
  export const createProduct = async (formData) => {
  const response = await instance.post("/products", formData);
  return response.data;
};

  // Update existing product
  export const updateProduct = async ({ id, formData }) => {
  const response = await instance.put(`/products/${id}`, formData);
  return response.data;
};

  // Delete product
  export const deleteProduct = async (id) => {
    const response = await instance.delete(`/products/${id}`);
    return response.data;
  };
