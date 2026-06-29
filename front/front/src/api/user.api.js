import instance from "./axios.js";

// ── Current user (me) ─────────────────────────────────────────────────────────

// ✅ NEW: get current user profile
export const getMe = async () => {
  const { data } = await instance.get("/users/me");
  return data.data;
};

// Update current user's profile (name + image as FormData)
export const updateMe = async (formData) => {
  const { data } = await instance.put("/users/me", formData);
  return data.data;
};

// ✅ NEW: change password
export const changePassword = async ({ currentPassword, newPassword }) => {
  const { data } = await instance.patch("/users/change-password", {
    currentPassword,
    newPassword,
  });
  return data;
};

// ── Admin: user management ────────────────────────────────────────────────────

export const getAllUsers = async ({ page = 1, limit = 10, search = "", role = "" } = {}) => {
  const { data } = await instance.get("/admin/users", {
    params: { page, limit, search, role },
  });
  return data;
};

export const getUserById = async (userId) => {
  const { data } = await instance.get(`/admin/users/${userId}`);
  return data.data;
};

// ✅ FIX: removed updateUser (PUT /users/:id doesn't exist in backend)
//         only role updates are supported via admin route
export const updateUserRole = async ({ userId, role }) => {
  const { data } = await instance.patch(`/admin/users/${userId}/role`, { role });
  return data.data;
};

export const deleteUser = async (userId) => {
  const { data } = await instance.delete(`/admin/users/${userId}`);
  return data;
};