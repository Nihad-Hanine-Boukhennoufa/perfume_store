import { useContext, useState, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import {
  User, Mail, LogOut, Package, ImageIcon,
  Clock, Truck, CheckCircle2, XCircle, X, Trash2,
  ChevronRight, Pencil, Camera, Save, AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import AuthContext from "../../context/AuthContext.jsx";
import { getMyOrders, cancelOrder } from "../../api/order.api.js";
import { updateMe } from "../../api/user.api.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt$ = (v) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(v);

const STATUS = {
  pending:   { label: "Pending",   Icon: Clock,        color: "var(--color-gold)",  bg: "rgba(201,168,76,0.1)",  border: "rgba(201,168,76,0.25)"  },
  shipped:   { label: "Shipped",   Icon: Truck,        color: "#7aabcc",            bg: "rgba(60,120,180,0.1)",  border: "rgba(60,120,180,0.25)"  },
  delivered: { label: "Delivered", Icon: CheckCircle2, color: "#70a880",            bg: "rgba(30,80,50,0.15)",   border: "rgba(60,120,80,0.25)"   },
  cancelled: { label: "Cancelled", Icon: XCircle,      color: "#c08080",            bg: "rgba(160,60,60,0.1)",   border: "rgba(160,60,60,0.25)"   },
};

const inputStyle = {
  background: "var(--color-charcoal)", border: "0.5px solid var(--color-smoke)",
  color: "var(--color-pearl)", fontFamily: "var(--font-body)", borderRadius: "0",
  width: "100%", outline: "none", fontSize: "14px",
  padding: "11px 14px", transition: "border-color .2s",
};

// Dismissed orders — per user in localStorage
const KEY = (id) => `dismissed_orders_${id}`;
const loadDismissed = (id) => { try { return new Set(JSON.parse(localStorage.getItem(KEY(id))) ?? []); } catch { return new Set(); } };
const saveDismissed = (id, s) => { try { localStorage.setItem(KEY(id), JSON.stringify([...s])); } catch {} };

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cfg = STATUS[status] ?? STATUS.pending;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] tracking-[2px] uppercase"
      style={{ color: cfg.color, background: cfg.bg, border: `0.5px solid ${cfg.border}`, fontFamily: "var(--font-body)" }}>
      <cfg.Icon size={10} strokeWidth={1.5} />
      {cfg.label}
    </span>
  );
}

// ─── Edit Profile Form ────────────────────────────────────────────────────────

function EditProfileSection({ user, onClose }) {
  const queryClient = useQueryClient();
  const { updateUserData } = useContext(AuthContext);
  const fileRef = useRef(null);

  const [name,    setName]    = useState(user.name  ?? "");
  const [preview, setPreview] = useState(user.image ?? null);
  const [imgFile, setImgFile] = useState(null);
  const [error,   setError]   = useState("");

  const mutation = useMutation({
    mutationFn: (userData) => updateMe(userData),
    onSuccess: (res) => {
      // Update auth context so Navbar reflects the new name/image instantly
      if (typeof updateUserData === "function") updateUserData(res.data);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated");
      onClose();
    },
    onError: (err) => setError(err?.response?.data?.message ?? "Failed to update profile"),
  });

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Please select a valid image");
    if (file.size > 5 * 1024 * 1024) return setError("Image must be under 5MB");
    setImgFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
    setError("");
  };

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) return setError("Name is required");
    const fd = new FormData();
    fd.append("name", name.trim());
    if (imgFile) fd.append("image", imgFile);
    mutation.mutate(fd);
  };

  return (
    <div className="mb-6 p-5"
      style={{ background: "var(--color-ink)", border: "0.5px solid var(--color-gold-dark)" }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-[9px] tracking-[4px] uppercase"
          style={{ color: "var(--color-gold)", fontFamily: "var(--font-body)" }}>Edit Profile</p>
        <button onClick={onClose}
          style={{ color: "var(--color-smoke)", background: "none", border: "none", cursor: "pointer" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-mist)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-smoke)")}
        ><X size={15} strokeWidth={1.5} /></button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-3 py-2.5 mb-4 text-sm"
          style={{ background: "rgba(160,60,60,0.12)", border: "0.5px solid rgba(160,60,60,0.3)", color: "#c08080", fontFamily: "var(--font-body)" }}>
          <AlertTriangle size={12} strokeWidth={1.5} style={{ flexShrink: 0 }} />
          {error}
        </div>
      )}

      <form onSubmit={submit} className="flex flex-col gap-5">

        {/* Avatar picker */}
        <div className="flex items-center gap-5">
          {/* Avatar preview */}
          <div className="relative flex-shrink-0">
            {preview
              ? <img src={preview} alt="Avatar"
                  className="w-16 h-16 rounded-full object-cover"
                  style={{ border: "0.5px solid var(--color-gold)" }} />
              : <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-medium uppercase"
                  style={{ background: "rgba(201,168,76,0.1)", border: "0.5px solid var(--color-gold-dark)", color: "var(--color-gold)", fontFamily: "var(--font-body)" }}>
                  {user.name?.[0] ?? <User size={22} />}
                </div>
            }
            {/* Camera overlay */}
            <button type="button" onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-150"
              style={{ background: "var(--color-gold)", border: "2px solid var(--color-obsidian)", cursor: "pointer" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-gold-light)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--color-gold)")}
            >
              <Camera size={11} style={{ color: "var(--color-obsidian)" }} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
          </div>

          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium" style={{ color: "var(--color-pearl)", fontFamily: "var(--font-body)" }}>
              {user.name}
            </p>
            <button type="button" onClick={() => fileRef.current?.click()}
              className="text-[10px] tracking-[1px] uppercase text-left transition-colors duration-150"
              style={{ color: "var(--color-mist)", fontFamily: "var(--font-body)", background: "none", border: "none", cursor: "pointer" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-gold)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-mist)")}
            >
              {imgFile ? "Change photo" : "Upload photo"}
            </button>
            {imgFile && (
              <button type="button"
                onClick={() => { setImgFile(null); setPreview(user.image ?? null); }}
                className="text-[10px] tracking-[1px] uppercase text-left transition-colors duration-150"
                style={{ color: "var(--color-smoke)", fontFamily: "var(--font-body)", background: "none", border: "none", cursor: "pointer" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#c47a7a")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-smoke)")}
              >Remove</button>
            )}
          </div>
        </div>

        {/* Name field */}
        <div>
          <label className="block text-[9px] tracking-[3px] uppercase mb-2"
            style={{ color: "var(--color-mist)", fontFamily: "var(--font-body)" }}>Full Name</label>
          <input type="text" value={name} onChange={(e) => { setName(e.target.value); setError(""); }}
            placeholder="Your name" style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-gold)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-smoke)")}
          />
        </div>

        {/* Email — read only */}
        <div>
          <label className="block text-[9px] tracking-[3px] uppercase mb-2"
            style={{ color: "var(--color-mist)", fontFamily: "var(--font-body)" }}>
            Email <span style={{ color: "var(--color-smoke)", letterSpacing: "1px" }}>— cannot be changed here</span>
          </label>
          <input type="email" value={user.email} readOnly
            style={{ ...inputStyle, color: "var(--color-smoke)", cursor: "not-allowed", opacity: 0.6 }} />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button type="submit" disabled={mutation.isPending}
            className="flex items-center gap-2 px-6 py-2.5 text-[10px] tracking-[2px] uppercase transition-all duration-200 disabled:opacity-50"
            style={{ background: "var(--color-gold)", color: "var(--color-obsidian)", border: "0.5px solid var(--color-gold)", fontFamily: "var(--font-body)", borderRadius: "0", cursor: "pointer" }}
            onMouseEnter={(e) => { if (!mutation.isPending) e.currentTarget.style.background = "var(--color-gold-light)"; }}
            onMouseLeave={(e) => { if (!mutation.isPending) e.currentTarget.style.background = "var(--color-gold)"; }}
          >
            <Save size={11} strokeWidth={1.5} />
            {mutation.isPending ? "Saving…" : "Save Changes"}
          </button>
          <button type="button" onClick={onClose}
            className="px-6 py-2.5 text-[10px] tracking-[2px] uppercase transition-all duration-200"
            style={{ background: "transparent", color: "var(--color-mist)", border: "0.5px solid var(--color-charcoal)", fontFamily: "var(--font-body)", borderRadius: "0", cursor: "pointer" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-smoke)"; e.currentTarget.style.color = "var(--color-pearl)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-charcoal)"; e.currentTarget.style.color = "var(--color-mist)"; }}
          >Cancel</button>
        </div>
      </form>
    </div>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────

function OrderCard({ order, onCancel, isCancelling, onDismiss }) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(order.createdAt).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  return (
    <div style={{ background: "var(--color-ink)", border: "0.5px solid var(--color-charcoal)" }}>
      {/* Header */}
      <button onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-4 px-4 py-4 text-left transition-colors duration-150"
        style={{ background: "none", border: "none", cursor: "pointer" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <span className="text-[10px] tracking-[2px] font-medium"
          style={{ color: "var(--color-smoke)", fontFamily: "var(--font-body)", minWidth: "80px" }}>
          #{order._id.slice(-8).toUpperCase()}
        </span>
        <StatusBadge status={order.status} />
        <span className="text-[10px] flex-1 text-left"
          style={{ color: "var(--color-smoke)", fontFamily: "var(--font-body)" }}>{date}</span>
        <span style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 400, color: "var(--color-pearl)" }}>
          {fmt$(order.total)}
        </span>
        <ChevronRight size={13} strokeWidth={1.5} className="flex-shrink-0 transition-transform duration-200"
          style={{ color: "var(--color-smoke)", transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }} />
      </button>

      {/* Expanded */}
      {expanded && (
        <div style={{ borderTop: "0.5px solid var(--color-charcoal)" }}>
          <div className="px-4 py-4 flex flex-col gap-3">
            {order.items.map((item, i) => {
              const product    = item.productId;
              const name       = product?.name ?? "Product unavailable";
              const primaryImg = product?.images?.find((img) => img.isPrimary) ?? product?.images?.[0];
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex-shrink-0 overflow-hidden"
                    style={{ width: "44px", height: "44px", background: "var(--color-obsidian)", border: "0.5px solid var(--color-charcoal)" }}>
                    {primaryImg?.url
                      ? <img src={primaryImg.url} alt={name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon size={14} strokeWidth={1} style={{ color: "var(--color-charcoal)" }} />
                        </div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate"
                      style={{ color: "var(--color-pearl)", fontFamily: "var(--font-body)" }}>{name}</p>
                    <p className="text-[11px]"
                      style={{ color: "var(--color-smoke)", fontFamily: "var(--font-body)" }}>
                      {fmt$(item.price)} × {item.quantity}
                    </p>
                  </div>
                  <span style={{ color: "var(--color-mist)", fontFamily: "var(--font-display)", fontSize: "14px" }}>
                    {fmt$(item.price * item.quantity)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-3 px-4 pb-4 pt-3"
            style={{ borderTop: "0.5px solid var(--color-charcoal)" }}>
            {order.status === "pending" && (
              <button onClick={() => onCancel(order._id)} disabled={isCancelling}
                className="flex items-center gap-1.5 text-[10px] tracking-[2px] uppercase transition-colors duration-150 disabled:opacity-50"
                style={{ color: "#c08080", fontFamily: "var(--font-body)", background: "none", border: "none", cursor: "pointer" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#d09090")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#c08080")}
              ><X size={11} strokeWidth={1.5} />{isCancelling ? "Cancelling…" : "Cancel order"}</button>
            )}
            {order.status === "cancelled" && (
              <button onClick={() => onDismiss(order._id)}
                className="flex items-center gap-1.5 text-[10px] tracking-[2px] uppercase transition-colors duration-150"
                style={{ color: "var(--color-smoke)", fontFamily: "var(--font-body)", background: "none", border: "none", cursor: "pointer" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-mist)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-smoke)")}
              ><Trash2 size={11} strokeWidth={1.5} /> Remove from list</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const Profile = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [dismissed, setDismissed] = useState(() =>
    user ? loadDismissed(user._id ?? user.id) : new Set()
  );

  const handleDismiss = useCallback((orderId) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(orderId);
      saveDismissed(user._id ?? user.id, next);
      return next;
    });
    toast.success("Order removed from your list");
  }, [user]);

  const { data: orders, isLoading, isError } = useQuery({
    queryKey: ["orders"],
    queryFn: getMyOrders,
    enabled: !!user,
  });

  const cancelMutation = useMutation({
    mutationFn: cancelOrder,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["orders"] }); toast.success("Order cancelled"); },
    onError: (err) => toast.error(err?.response?.data?.message ?? "Failed to cancel order"),
  });

  const visibleOrders = orders?.filter((o) => !dismissed.has(o._id)) ?? [];

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-5"
        style={{ background: "var(--color-obsidian)" }}>
        <User size={36} strokeWidth={1} style={{ color: "var(--color-charcoal)", marginBottom: "16px" }} />
        <p className="text-lg mb-6" style={{ color: "var(--color-mist)", fontFamily: "var(--font-display)" }}>
          Please sign in to view your profile
        </p>
        <Link to="/login" className="px-8 py-3 text-[10px] tracking-[3px] uppercase transition-all duration-200"
          style={{ background: "var(--color-gold)", color: "var(--color-obsidian)", border: "0.5px solid var(--color-gold)", fontFamily: "var(--font-body)" }}>
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--color-obsidian)", minHeight: "100vh" }}>
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-10">

        {/* Page header */}
        <div className="mb-8">
          <p className="text-[9px] tracking-[5px] uppercase mb-1"
            style={{ color: "var(--color-gold)", fontFamily: "var(--font-body)" }}>Account</p>
          <h1 className="font-medium"
            style={{ fontFamily: "var(--font-display)", fontSize: "36px", color: "var(--color-pearl)" }}>
            My Profile
          </h1>
        </div>

        {/* ── Edit form (shown when editing) ───────────────────────── */}
        {editing && (
          <EditProfileSection user={user} onClose={() => setEditing(false)} />
        )}

        {/* ── User card (shown when NOT editing) ───────────────────── */}
        {!editing && (
          <div className="flex items-center gap-5 p-5 mb-8"
            style={{ background: "var(--color-ink)", border: "0.5px solid var(--color-charcoal)" }}>
            {/* Avatar */}
            {user.image
              ? <img src={user.image} alt={user.name}
                  className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                  style={{ border: "0.5px solid var(--color-gold)" }} />
              : <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 text-lg font-medium uppercase"
                  style={{ background: "rgba(201,168,76,0.1)", border: "0.5px solid var(--color-gold-dark)", color: "var(--color-gold)", fontFamily: "var(--font-body)" }}>
                  {user.name?.[0] ?? <User size={20} />}
                </div>
            }

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-base font-medium truncate"
                style={{ color: "var(--color-pearl)", fontFamily: "var(--font-body)" }}>{user.name}</p>
              <p className="text-sm flex items-center gap-1.5 mt-1"
                style={{ color: "var(--color-mist)", fontFamily: "var(--font-body)" }}>
                <Mail size={12} strokeWidth={1.5} /> {user.email}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2 text-[10px] tracking-[2px] uppercase transition-all duration-200"
                style={{ color: "var(--color-mist)", border: "0.5px solid var(--color-charcoal)", fontFamily: "var(--font-body)", background: "transparent", borderRadius: "0", cursor: "pointer" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-gold)"; e.currentTarget.style.color = "var(--color-gold)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-charcoal)"; e.currentTarget.style.color = "var(--color-mist)"; }}
              >
                <Pencil size={11} strokeWidth={1.5} /> Edit
              </button>

              <button onClick={logout}
                className="flex items-center gap-2 px-4 py-2 text-[10px] tracking-[2px] uppercase transition-colors duration-150"
                style={{ color: "var(--color-smoke)", border: "0.5px solid var(--color-charcoal)", fontFamily: "var(--font-body)", background: "transparent", borderRadius: "0", cursor: "pointer" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(160,60,60,0.5)"; e.currentTarget.style.color = "#c08080"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-charcoal)"; e.currentTarget.style.color = "var(--color-smoke)"; }}
              >
                <LogOut size={11} strokeWidth={1.5} /> Logout
              </button>
            </div>
          </div>
        )}

        {/* ── Orders ─────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[9px] tracking-[5px] uppercase mb-1"
                style={{ color: "var(--color-gold)", fontFamily: "var(--font-body)" }}>History</p>
              <h2 className="font-medium"
                style={{ fontFamily: "var(--font-display)", fontSize: "24px", color: "var(--color-pearl)" }}>
                My Orders
              </h2>
            </div>
            {visibleOrders.length > 0 && (
              <span className="text-sm" style={{ color: "var(--color-smoke)", fontFamily: "var(--font-body)" }}>
                {visibleOrders.length} order{visibleOrders.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {isLoading && (
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 animate-pulse"
                  style={{ background: "var(--color-ink)", border: "0.5px solid var(--color-charcoal)" }} />
              ))}
            </div>
          )}

          {isError && (
            <p className="text-sm text-center py-8"
              style={{ color: "#c08080", fontFamily: "var(--font-body)" }}>
              Failed to load orders
            </p>
          )}

          {!isLoading && !isError && visibleOrders.length === 0 && (
            <div className="flex flex-col items-center py-20 text-center"
              style={{ border: "0.5px solid var(--color-charcoal)" }}>
              <Package size={32} strokeWidth={1}
                style={{ color: "var(--color-charcoal)", marginBottom: "16px" }} />
              <p style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 400, color: "var(--color-mist)", marginBottom: "6px" }}>
                No orders yet
              </p>
              <p className="text-sm mb-8"
                style={{ color: "var(--color-smoke)", fontFamily: "var(--font-body)" }}>
                Your orders will appear here
              </p>
              <Link to="/products"
                className="px-8 py-3 text-[10px] tracking-[3px] uppercase transition-all duration-200"
                style={{ background: "var(--color-gold)", color: "var(--color-obsidian)", border: "0.5px solid var(--color-gold)", fontFamily: "var(--font-body)" }}>
                Browse Collection
              </Link>
            </div>
          )}

          {!isLoading && !isError && visibleOrders.length > 0 && (
            <div className="flex flex-col gap-2">
              {visibleOrders.map((order) => (
                <OrderCard key={order._id} order={order}
                  onCancel={(id) => cancelMutation.mutate(id)}
                  isCancelling={cancelMutation.isPending}
                  onDismiss={handleDismiss}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;