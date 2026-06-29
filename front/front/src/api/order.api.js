import instance from "./axios.js";

// ── User ──────────────────────────────────────────────────────────────────────

export const createOrder = async (orderData) => {
  const { data } = await instance.post("/orders", orderData);
  return data.data;
};

export const getMyOrders = async (status) => {
  const { data } = await instance.get("/orders/myOrders", {
    params: status ? { status } : {},
  });
  return data.data;
};

// ✅ FIX: was PUT /orders/cancel/:id — correct route is PATCH /:orderId/cancel
export const cancelOrder = async (orderId) => {
  const { data } = await instance.patch(`/orders/${orderId}/cancel`);
  return data.data;
};

// ── Admin ─────────────────────────────────────────────────────────────────────

// ✅ FIX: was PUT /orders/updateStatus/:id — correct route is PATCH /admin/orders/:orderId/status
export const adminGetAllOrders = async ({ status } = {}) => {
  const { data } = await instance.get("/admin/orders", {
    params: status ? { status } : {},
  });
  return data.data;
};

export const adminUpdateOrderStatus = async ({ orderId, newStatus }) => {
  const { data } = await instance.patch(`/admin/orders/${orderId}/status`, { newStatus });
  return data.data;
};

// ✅ FIX: was DELETE /orders/delete/:id — correct route is DELETE /admin/orders/:orderId
export const adminDeleteOrder = async (orderId) => {
  const { data } = await instance.delete(`/admin/orders/${orderId}`);
  return data;
};