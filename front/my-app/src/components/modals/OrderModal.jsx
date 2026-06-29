import { Package, ImageIcon } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt$ = (v) =>
  new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", minimumFractionDigits: 2,
  }).format(v);

const STATUS_CONFIG = {
  pending:   { label: "Pending",   classes: "bg-amber-50 text-amber-700 border-amber-100"   },
  shipped:   { label: "Shipped",   classes: "bg-blue-50 text-blue-700 border-blue-100"      },
  delivered: { label: "Delivered", classes: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  cancelled: { label: "Cancelled", classes: "bg-red-50 text-red-700 border-red-100"         },
};

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

// ─── OrderModel ───────────────────────────────────────────────────────────────

const OrderModel = ({ order, onUpdateStatus, onDelete }) => {
  const statusCfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="p-5">

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-sm font-bold text-gray-900 font-mono">
                #{order._id.slice(-8).toUpperCase()}
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusCfg.classes}`}>
                {statusCfg.label}
              </span>
            </div>
            <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Customer: <span className="font-medium text-gray-600 font-mono">{order.userId?.toString().slice(-8).toUpperCase()}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-gray-900">{fmt$(order.total)}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {order.items.length} {order.items.length === 1 ? "item" : "items"}
            </p>
          </div>
        </div>

        {/* ── Items ───────────────────────────────────────────────── */}
        <div className="border-t border-gray-50 pt-4 mb-4 space-y-3">
          {order.items.map((item, index) => {
            const product = item.productId;
            const name    = product?.name ?? "Product unavailable";

            // Fix: read from images[] Cloudinary array — not the old `image`
            // string field, which doesn't exist on the product schema.
            const primaryImg =
              product?.images?.find((img) => img.isPrimary) ??
              product?.images?.[0] ??
              null;

            return (
              <div key={index} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                    {primaryImg?.url ? (
                      <img
                        src={primaryImg.url}
                        alt={name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon size={14} className="text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                    <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-gray-900 flex-shrink-0">
                  {fmt$(item.price * item.quantity)}
                </p>
              </div>
            );
          })}
        </div>

        {/* ── Actions ─────────────────────────────────────────────── */}
        <div className="flex gap-2 pt-4 border-t border-gray-50">
          <button
            onClick={() => onUpdateStatus(order)}
            className="px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors text-xs font-semibold"
          >
            Update Status
          </button>
          {(order.status === "delivered" || order.status === "cancelled") && (
            <button
              onClick={() => onDelete(order)}
              className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl hover:bg-red-100 transition-colors text-xs font-semibold"
            >
              Delete Order
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderModel;