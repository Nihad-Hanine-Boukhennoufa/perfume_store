import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShoppingCart, AlertCircle, XCircle, Clock,
  Truck, CheckCircle2, Package, ImageIcon, ChevronRight,
} from "lucide-react";
import { adminGetAllOrders, adminUpdateOrderStatus, adminDeleteOrder } from "../../api/order.api.js";

const fmt$ = (v) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(v);

const STATUS_CONFIG = {
  pending:   { label: "Pending",   Icon: Clock,        color: "var(--color-gold)",  bg: "rgba(201,168,76,0.1)",  border: "rgba(201,168,76,0.25)"  },
  shipped:   { label: "Shipped",   Icon: Truck,        color: "#7aabcc",            bg: "rgba(60,120,180,0.1)",  border: "rgba(60,120,180,0.25)"  },
  delivered: { label: "Delivered", Icon: CheckCircle2, color: "#70a880",            bg: "rgba(30,80,50,0.15)",   border: "rgba(60,120,80,0.25)"   },
  cancelled: { label: "Cancelled", Icon: XCircle,      color: "#c08080",            bg: "rgba(160,60,60,0.1)",   border: "rgba(160,60,60,0.25)"   },
};

const STATUS_TABS = ["", "pending", "shipped", "delivered", "cancelled"];
const VALID_STATUSES = ["pending", "shipped", "delivered", "cancelled"];

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] tracking-[2px] uppercase shrink-0"
      style={{ color: cfg.color, background: cfg.bg, border: `0.5px solid ${cfg.border}`, fontFamily: "var(--font-body)" }}>
      <cfg.Icon size={9} strokeWidth={1.5} />{cfg.label}
    </span>
  );
}

function OrderRow({ order, onUpdateStatus, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const isDelivered = order.status === "delivered";
  const isCancelled = order.status === "cancelled";
  const canDelete   = isDelivered || isCancelled;

  return (
    <div style={{ background: "var(--color-ink)", border: "0.5px solid var(--color-charcoal)" }}>
      {/* Header row */}
      <button onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors duration-150"
        style={{ background: "none", border: "none", cursor: "pointer" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <span className="text-[10px] tracking-[1px] font-medium shrink-0"
          style={{ color: "var(--color-smoke)", fontFamily: "var(--font-body)", minWidth: 80 }}>
          #{order._id.slice(-8).toUpperCase()}
        </span>
        <StatusBadge status={order.status} />
        <span className="text-[10px] flex-1 text-left"
          style={{ color: "var(--color-smoke)", fontFamily: "var(--font-body)" }}>
          {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
        <span style={{ fontFamily: "var(--font-display)", fontSize: "16px", color: "var(--color-pearl)" }}>
          {fmt$(order.total)}
        </span>
        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          {!isDelivered && (
            <button onClick={() => onUpdateStatus(order)}
              className="px-3 py-1.5 text-[9px] tracking-[2px] uppercase transition-all duration-150"
              style={{ color: "var(--color-mist)", border: "0.5px solid var(--color-charcoal)", fontFamily: "var(--font-body)", background: "none", borderRadius: 0, cursor: "pointer" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-gold)"; e.currentTarget.style.color = "var(--color-gold)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-charcoal)"; e.currentTarget.style.color = "var(--color-mist)"; }}
            >Update</button>
          )}
          {canDelete && (
            <button onClick={() => onDelete(order)}
              className="px-3 py-1.5 text-[9px] tracking-[2px] uppercase transition-all duration-150"
              style={{ color: "var(--color-smoke)", border: "0.5px solid var(--color-charcoal)", fontFamily: "var(--font-body)", background: "none", borderRadius: 0, cursor: "pointer" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(160,60,60,0.4)"; e.currentTarget.style.color = "#c08080"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-charcoal)"; e.currentTarget.style.color = "var(--color-smoke)"; }}
            >Delete</button>
          )}
        </div>
        <ChevronRight size={13} strokeWidth={1.5} className="shrink-0 transition-transform duration-200"
          style={{ color: "var(--color-smoke)", transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }} />
      </button>

      {/* Expanded items */}
      {expanded && (
        <div style={{ borderTop: "0.5px solid var(--color-charcoal)" }}>
          <div className="px-5 py-4 flex flex-col gap-3">
            {order.items.map((item, i) => {
              const product    = item.productId;
              const name       = product?.name ?? "Product unavailable";
              const primaryImg = product?.images?.find((img) => img.isPrimary) ?? product?.images?.[0];
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="shrink-0 overflow-hidden"
                    style={{ width: 40, height: 40, background: "var(--color-obsidian)", border: "0.5px solid var(--color-charcoal)" }}>
                    {primaryImg?.url
                      ? <img src={primaryImg.url} alt={name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon size={13} strokeWidth={1} style={{ color: "var(--color-charcoal)" }} />
                        </div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate"
                      style={{ color: "var(--color-pearl)", fontFamily: "var(--font-body)" }}>{name}</p>
                    <p className="text-[10px] mt-0.5"
                      style={{ color: "var(--color-smoke)", fontFamily: "var(--font-body)" }}>
                      {item.volume}ml · {fmt$(item.price)} × {item.quantity}
                    </p>
                  </div>
                  <span style={{ color: "var(--color-mist)", fontFamily: "var(--font-display)", fontSize: "14px" }}>
                    {fmt$(item.price * item.quantity)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const AdminOrders = () => {
  const [statusFilter,    setStatusFilter]    = useState("");
  const [selectedOrder,   setSelectedOrder]   = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newStatus,       setNewStatus]       = useState("");

  const queryClient = useQueryClient();
  const invalidate  = () => queryClient.invalidateQueries({ queryKey: ["adminOrders"] });

  const { data: orders, isLoading, error } = useQuery({
    queryKey: ["adminOrders", statusFilter],
    queryFn:  () => adminGetAllOrders({ status: statusFilter }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, newStatus }) => adminUpdateOrderStatus({ orderId, newStatus }),
    onSuccess:  () => { invalidate(); setShowStatusModal(false); setSelectedOrder(null); setNewStatus(""); },
    onError:    (err) => console.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: adminDeleteOrder,
    onSuccess:  () => { invalidate(); setShowDeleteModal(false); setSelectedOrder(null); },
    onError:    (err) => console.error(err.message),
  });

  const openStatusModal = (order) => { setSelectedOrder(order); setNewStatus(order.status); setShowStatusModal(true); };
  const openDeleteModal = (order) => { setSelectedOrder(order); setShowDeleteModal(true); };

  const inputStyle = {
    background: "var(--color-charcoal)", border: "0.5px solid var(--color-smoke)",
    color: "var(--color-pearl)", fontFamily: "var(--font-body)", borderRadius: 0,
    width: "100%", padding: "10px 14px", outline: "none", fontSize: "13px",
  };

  return (
    <div className="p-6 lg:p-8" style={{ background: "var(--color-obsidian)", minHeight: "100vh" }}>
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <p className="text-[9px] tracking-[5px] uppercase mb-1"
            style={{ color: "var(--color-gold)", fontFamily: "var(--font-body)" }}>Admin</p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "36px", fontWeight: 400, color: "var(--color-pearl)" }}>
            Orders
          </h1>
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 p-4"
          style={{ background: "var(--color-ink)", border: "0.5px solid var(--color-charcoal)" }}>
          {STATUS_TABS.map((tab) => {
            const cfg     = tab ? STATUS_CONFIG[tab] : null;
            const isActive = statusFilter === tab;
            return (
              <button key={tab} onClick={() => setStatusFilter(tab)}
                className="px-4 py-2 text-[9px] tracking-[2px] uppercase transition-all duration-150"
                style={{
                  fontFamily:  "var(--font-body)",
                  background:  isActive ? (cfg?.bg ?? "rgba(201,168,76,0.1)") : "transparent",
                  color:       isActive ? (cfg?.color ?? "var(--color-gold)") : "var(--color-mist)",
                  border:      `0.5px solid ${isActive ? (cfg?.border ?? "rgba(201,168,76,0.3)") : "var(--color-charcoal)"}`,
                  borderRadius: 0, cursor: "pointer",
                }}>
                {tab ? tab.charAt(0).toUpperCase() + tab.slice(1) : "All Orders"}
              </button>
            );
          })}
          <span className="ml-auto self-center text-[10px]"
            style={{ color: "var(--color-smoke)", fontFamily: "var(--font-body)" }}>
            <span style={{ color: "var(--color-pearl)" }}>{orders?.length ?? 0}</span> orders
          </span>
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse"
                style={{ background: "var(--color-ink)", border: "0.5px solid var(--color-charcoal)" }} />
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 px-4 py-3 text-sm"
            style={{ background: "rgba(160,60,60,0.1)", border: "0.5px solid rgba(160,60,60,0.3)", color: "#c08080", fontFamily: "var(--font-body)" }}>
            <AlertCircle size={14} className="shrink-0" />
            Error loading orders: {error.message}
          </div>
        ) : !orders?.length ? (
          <div className="flex flex-col items-center py-20"
            style={{ border: "0.5px solid var(--color-charcoal)" }}>
            <ShoppingCart size={32} strokeWidth={1} style={{ color: "var(--color-charcoal)", marginBottom: 16 }} />
            <p style={{ fontFamily: "var(--font-display)", fontSize: "20px", color: "var(--color-mist)" }}>
              {statusFilter ? `No ${statusFilter} orders` : "No orders yet"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((order) => (
              <OrderRow key={order._id} order={order}
                onUpdateStatus={openStatusModal}
                onDelete={openDeleteModal}
              />
            ))}
          </div>
        )}
      </div>

      {/* Update Status Modal */}
      {showStatusModal && selectedOrder && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-md p-6"
            style={{ background: "var(--color-ink)", border: "0.5px solid var(--color-charcoal)" }}>
            <p className="text-[9px] tracking-[4px] uppercase mb-2"
              style={{ color: "var(--color-gold)", fontFamily: "var(--font-body)" }}>Update Status</p>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "22px", color: "var(--color-pearl)", marginBottom: 20 }}>
              Order #{selectedOrder._id.slice(-8).toUpperCase()}
            </h3>

            {selectedOrder.status === "delivered" ? (
              <p className="text-sm py-3 px-4 mb-5"
                style={{ background: "rgba(60,120,80,0.1)", border: "0.5px solid rgba(60,120,80,0.25)", color: "#70a880", fontFamily: "var(--font-body)" }}>
                This order has been delivered and cannot be changed.
              </p>
            ) : (
              <div className="mb-6">
                <label className="block text-[9px] tracking-[3px] uppercase mb-2"
                  style={{ color: "var(--color-mist)", fontFamily: "var(--font-body)" }}>New Status</label>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-gold)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-smoke)")}
                >
                  {VALID_STATUSES.map((s) => (
                    <option key={s} value={s} style={{ background: "var(--color-ink)" }}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {updateStatusMutation.isError && (
              <p className="text-sm px-4 py-2.5 mb-4"
                style={{ background: "rgba(160,60,60,0.1)", border: "0.5px solid rgba(160,60,60,0.3)", color: "#c08080", fontFamily: "var(--font-body)" }}>
                {updateStatusMutation.error?.response?.data?.message || updateStatusMutation.error?.message}
              </p>
            )}

            <div className="flex gap-3">
              {selectedOrder.status !== "delivered" && (
                <button
                  onClick={() => updateStatusMutation.mutate({ orderId: selectedOrder._id, newStatus })}
                  disabled={updateStatusMutation.isPending || newStatus === selectedOrder.status}
                  className="flex-1 py-3 text-[10px] tracking-[2px] uppercase transition-all duration-200 disabled:opacity-50"
                  style={{ background: "var(--color-gold)", color: "var(--color-obsidian)", border: "none", fontFamily: "var(--font-body)", borderRadius: 0, cursor: "pointer" }}
                  onMouseEnter={(e) => { if (!updateStatusMutation.isPending) e.currentTarget.style.background = "var(--color-gold-light)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-gold)"; }}
                >{updateStatusMutation.isPending ? "Updating…" : "Update"}</button>
              )}
              <button
                onClick={() => { setShowStatusModal(false); setSelectedOrder(null); setNewStatus(""); }}
                className="flex-1 py-3 text-[10px] tracking-[2px] uppercase transition-all duration-200"
                style={{ background: "transparent", color: "var(--color-mist)", border: "0.5px solid var(--color-charcoal)", fontFamily: "var(--font-body)", borderRadius: 0, cursor: "pointer" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-smoke)"; e.currentTarget.style.color = "var(--color-pearl)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-charcoal)"; e.currentTarget.style.color = "var(--color-mist)"; }}
              >{selectedOrder.status === "delivered" ? "Close" : "Cancel"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedOrder && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-md p-6"
            style={{ background: "var(--color-ink)", border: "0.5px solid rgba(160,60,60,0.3)" }}>
            <div className="flex items-center gap-3 mb-5">
              <XCircle size={20} strokeWidth={1.5} style={{ color: "#c08080", flexShrink: 0 }} />
              <div>
                <p className="text-[9px] tracking-[4px] uppercase"
                  style={{ color: "#c08080", fontFamily: "var(--font-body)" }}>Permanent Action</p>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "22px", color: "var(--color-pearl)" }}>
                  Delete Order
                </h3>
              </div>
            </div>
            <p className="text-sm px-4 py-3 mb-6"
              style={{ background: "rgba(160,60,60,0.06)", border: "0.5px solid rgba(160,60,60,0.2)", color: "var(--color-mist)", fontFamily: "var(--font-body)" }}>
              Permanently delete order{" "}
              <span style={{ color: "var(--color-pearl)", fontFamily: "monospace" }}>
                #{selectedOrder._id.slice(-8).toUpperCase()}
              </span>? This cannot be undone.
            </p>
            {deleteMutation.isError && (
              <p className="text-sm px-4 py-2.5 mb-4"
                style={{ background: "rgba(160,60,60,0.1)", border: "0.5px solid rgba(160,60,60,0.3)", color: "#c08080", fontFamily: "var(--font-body)" }}>
                {deleteMutation.error?.response?.data?.message || deleteMutation.error?.message}
              </p>
            )}
            <div className="flex gap-3">
              <button onClick={() => deleteMutation.mutate(selectedOrder._id)}
                disabled={deleteMutation.isPending}
                className="flex-1 py-3 text-[10px] tracking-[2px] uppercase transition-all duration-200 disabled:opacity-50"
                style={{ background: "rgba(160,60,60,0.15)", color: "#c08080", border: "0.5px solid rgba(160,60,60,0.3)", fontFamily: "var(--font-body)", borderRadius: 0, cursor: "pointer" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(160,60,60,0.25)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(160,60,60,0.15)"; }}
              >{deleteMutation.isPending ? "Deleting…" : "Delete Order"}</button>
              <button onClick={() => { setShowDeleteModal(false); setSelectedOrder(null); }}
                className="flex-1 py-3 text-[10px] tracking-[2px] uppercase"
                style={{ background: "transparent", color: "var(--color-mist)", border: "0.5px solid var(--color-charcoal)", fontFamily: "var(--font-body)", borderRadius: 0, cursor: "pointer" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-smoke)"; e.currentTarget.style.color = "var(--color-pearl)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-charcoal)"; e.currentTarget.style.color = "var(--color-mist)"; }}
              >Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;