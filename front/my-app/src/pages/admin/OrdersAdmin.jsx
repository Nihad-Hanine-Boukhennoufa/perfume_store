import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShoppingCart, AlertCircle, XCircle } from "lucide-react";
import {
  adminGetAllOrders,
  adminUpdateOrderStatus,
  adminDeleteOrder,
} from "../../api/order.api.js";
import OrderModal from "../../components/modals/OrderModal.jsx";

const STATUS_TABS = [
  { value: "",          label: "All Orders", color: "bg-gray-900 text-white",    inactive: "text-gray-500 hover:text-gray-700 hover:bg-gray-100"    },
  { value: "pending",   label: "Pending",    color: "bg-amber-500 text-white",   inactive: "text-amber-600 hover:bg-amber-50"                       },
  { value: "shipped",   label: "Shipped",    color: "bg-blue-600 text-white",    inactive: "text-blue-600 hover:bg-blue-50"                         },
  { value: "delivered", label: "Delivered",  color: "bg-emerald-600 text-white", inactive: "text-emerald-600 hover:bg-emerald-50"                   },
  { value: "cancelled", label: "Cancelled",  color: "bg-red-600 text-white",     inactive: "text-red-600 hover:bg-red-50"                           },
];

const UPDATABLE_STATUSES = ["pending", "shipped", "delivered", "cancelled"];

const AdminOrders = () => {
  const [statusFilter,   setStatusFilter]   = useState("");
  const [selectedOrder,  setSelectedOrder]  = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newStatus,      setNewStatus]      = useState("");

  const queryClient = useQueryClient();
  const invalidate  = () => queryClient.invalidateQueries({ queryKey: ["adminOrders"] });

  const { data: orders, isLoading, error } = useQuery({
    queryKey: ["adminOrders", statusFilter],
    // ✅ FIX: use adminGetAllOrders (not getAllOrders) which hits /admin/orders
    queryFn:  () => adminGetAllOrders({ status: statusFilter }),
  });

  const updateStatusMutation = useMutation({
    // ✅ FIX: adminUpdateOrderStatus takes { orderId, newStatus } not (orderId, status)
    mutationFn: ({ orderId, newStatus }) => adminUpdateOrderStatus({ orderId, newStatus }),
    onSuccess:  () => { invalidate(); setShowStatusModal(false); setSelectedOrder(null); setNewStatus(""); },
    onError:    (err) => console.error("Failed to update order status:", err.message),
  });

  const deleteOrderMutation = useMutation({
    mutationFn: adminDeleteOrder,
    onSuccess:  () => { invalidate(); setShowDeleteModal(false); setSelectedOrder(null); },
    onError:    (err) => console.error("Failed to delete order:", err.message),
  });

  const handleUpdateStatus = () => {
    if (selectedOrder && newStatus && newStatus !== selectedOrder.status) {
      updateStatusMutation.mutate({ orderId: selectedOrder._id, newStatus });
    }
  };

  const openStatusModal = (order) => { setSelectedOrder(order); setNewStatus(order.status); setShowStatusModal(true); };
  const openDeleteModal = (order) => { setSelectedOrder(order); setShowDeleteModal(true); };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-16 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 text-sm">
            <AlertCircle size={18} className="shrink-0" />
            <span>Error loading orders: {error.message}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-400 mt-1 text-sm">Manage and track all customer orders</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {STATUS_TABS.map((tab) => (
                <button key={tab.value} onClick={() => setStatusFilter(tab.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    statusFilter === tab.value ? tab.color : `bg-transparent ${tab.inactive}`
                  }`}>
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <ShoppingCart size={14} />
              <span><span className="font-bold text-gray-900">{orders?.length ?? 0}</span> orders</span>
            </div>
          </div>
        </div>

        {orders && orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 flex flex-col items-center text-gray-300">
            <ShoppingCart size={40} className="mb-3" />
            <h3 className="text-base font-semibold text-gray-400 mb-1">No orders found</h3>
            <p className="text-sm text-gray-300">
              {statusFilter ? `No ${statusFilter} orders at the moment.` : "No orders have been placed yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders?.map((order) => (
              <OrderModal key={order._id} order={order}
                onUpdateStatus={openStatusModal}
                onDelete={openDeleteModal} />
            ))}
          </div>
        )}
      </div>

      {/* Update Status Modal */}
      {showStatusModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Update Order Status</h3>
            <p className="text-sm text-gray-400 mb-5">
              Order <span className="font-mono font-semibold text-gray-700">#{selectedOrder._id.slice(-8).toUpperCase()}</span>
            </p>
            {selectedOrder.status === "delivered" ? (
              <div className="mb-6 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-sm text-emerald-700">
                This order has been delivered and cannot be changed.
              </div>
            ) : (
              <div className="mb-6">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">New Status</label>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50">
                  {UPDATABLE_STATUSES.map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
            )}
            {updateStatusMutation.isError && (
              <p className="mb-4 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5">
                {updateStatusMutation.error?.response?.data?.message || updateStatusMutation.error?.message}
              </p>
            )}
            <div className="flex gap-3">
              {selectedOrder.status !== "delivered" && (
                <button onClick={handleUpdateStatus}
                  disabled={updateStatusMutation.isPending || newStatus === selectedOrder.status}
                  className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-semibold text-sm disabled:opacity-50">
                  {updateStatusMutation.isPending ? "Updating…" : "Update Status"}
                </button>
              )}
              <button onClick={() => { setShowStatusModal(false); setSelectedOrder(null); setNewStatus(""); }}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold text-sm">
                {selectedOrder.status === "delivered" ? "Close" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <XCircle size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Delete Order</h3>
                <p className="text-xs text-gray-400">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6 bg-gray-50 rounded-xl px-4 py-3">
              Permanently delete order{" "}
              <span className="font-mono font-semibold text-gray-900">#{selectedOrder._id.slice(-8).toUpperCase()}</span>?
            </p>
            {deleteOrderMutation.isError && (
              <p className="mb-4 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5">
                {deleteOrderMutation.error?.response?.data?.message || deleteOrderMutation.error?.message}
              </p>
            )}
            <div className="flex gap-3">
              <button onClick={() => deleteOrderMutation.mutate(selectedOrder._id)}
                disabled={deleteOrderMutation.isPending}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold text-sm disabled:opacity-50">
                {deleteOrderMutation.isPending ? "Deleting…" : "Delete Order"}
              </button>
              <button onClick={() => { setShowDeleteModal(false); setSelectedOrder(null); }}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold text-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;