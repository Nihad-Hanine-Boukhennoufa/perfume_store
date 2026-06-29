import instance from "./axios.js";

export const registerUser = async (formData) => {
  // FormData — don't set Content-Type manually
  const { data } = await instance.post("/auth/register", formData);
  return data;
};

export const loginUser = async (credentials) => {
  const { data } = await instance.post("/auth/login", credentials);
  return data;
};

// ✅ NEW: Forgot password — sends reset link to email
export const forgotPassword = async (email) => {
  const { data } = await instance.post("/auth/forgot-password", { email });
  return data;
};

// ✅ NEW: Reset password — token comes from the URL
export const resetPassword = async ({ token, newPassword }) => {
  const { data } = await instance.post(`/auth/reset-password/${token}`, { newPassword });
  return data;
};