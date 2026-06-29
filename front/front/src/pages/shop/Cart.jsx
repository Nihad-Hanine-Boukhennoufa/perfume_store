import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { getCart, removeFromCart, clearCart, updateCartItem } from "../../api/cart.api";
import { createOrder } from "../../api/order.api";
import toast from "react-hot-toast";
import {
  Trash2, Minus, Plus, X, ImageIcon,
  ShoppingBag, ArrowRight, ShoppingCart,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt$ = (v) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(v);

const goldBtn = {
  background: "var(--color-gold)", color: "var(--color-obsidian)",
  border: "0.5px solid var(--color-gold)", fontFamily: "var(--font-body)", borderRadius: "0",
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="max-w-4xl mx-auto px-5 sm:px-8 py-10">
      <div className="h-4 w-28 mb-8 animate-pulse" style={{ background: "var(--color-charcoal)" }} />
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 p-4 animate-pulse"
            style={{ background: "var(--color-ink)", border: "0.5px solid var(--color-charcoal)" }}>
            <div className="w-16 h-16 flex-shrink-0" style={{ background: "var(--color-charcoal)" }} />
            <div className="flex-1 space-y-2">
              <div className="h-2 w-16" style={{ background: "var(--color-charcoal)" }} />
              <div className="h-3 w-40" style={{ background: "var(--color-charcoal)" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Cart Item Row ────────────────────────────────────────────────────────────

function CartItemRow({ item, onRemove, onQuantityChange, isRemoving }) {
  const product    = item.productId;
  const primaryImg = product?.images?.find((img) => img.isPrimary) ?? product?.images?.[0];
  const name       = product?.name        ?? "Unknown product";
  const price      = product?.price       ?? item.price ?? 0;
  const brandName  = product?.brand?.name ?? product?.brand ?? "—";
  const maxStock   = product?.stock       ?? 99;

  return (
    <div className="flex items-center gap-4 p-4 transition-colors duration-150"
      style={{ borderBottom: "0.5px solid var(--color-charcoal)" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {/* Image */}
      <Link to={`/products/${product?._id}`}
        className="flex-shrink-0 overflow-hidden transition-opacity duration-200 hover:opacity-80"
        style={{ width: "72px", height: "72px", background: "var(--color-obsidian)", border: "0.5px solid var(--color-charcoal)" }}>
        {primaryImg?.url
          ? <img src={primaryImg.url} alt={name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center">
              <ImageIcon size={20} strokeWidth={1} style={{ color: "var(--color-charcoal)" }} />
            </div>
        }
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[9px] tracking-[2px] uppercase mb-1"
          style={{ color: "var(--color-gold)", fontFamily: "var(--font-body)" }}>{brandName}</p>
        <Link to={`/products/${product?._id}`}
          className="text-sm font-medium truncate block transition-colors duration-150"
          style={{ color: "var(--color-pearl)", fontFamily: "var(--font-body)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-gold-light)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-pearl)")}
        >{name}</Link>
        <p className="text-sm mt-1" style={{ color: "var(--color-mist)", fontFamily: "var(--font-body)" }}>
          {fmt$(price)} <span style={{ color: "var(--color-smoke)" }}>each</span>
        </p>
      </div>

      {/* Quantity */}
      <div className="flex items-center flex-shrink-0" style={{ border: "0.5px solid var(--color-charcoal)" }}>
        {[
          { Icon: Minus, fn: () => onQuantityChange(product._id, item.quantity - 1), disabled: item.quantity <= 1 },
          { Icon: Plus,  fn: () => onQuantityChange(product._id, item.quantity + 1), disabled: item.quantity >= maxStock },
        ].flatMap(({ Icon, fn, disabled }, idx) => {
          const btn = (
            <button key={idx} onClick={fn} disabled={disabled}
              className="w-8 h-8 flex items-center justify-center transition-colors duration-150 disabled:opacity-30"
              style={{ color: "var(--color-mist)", background: "transparent", border: "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-charcoal)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            ><Icon size={11} strokeWidth={1.5} /></button>
          );
          return idx === 0
            ? [btn, <span key="v" className="w-9 text-center text-sm font-medium"
                style={{ color: "var(--color-pearl)", fontFamily: "var(--font-body)",
                  borderLeft: "0.5px solid var(--color-charcoal)",
                  borderRight: "0.5px solid var(--color-charcoal)" }}>
                {item.quantity}
              </span>]
            : [btn];
        })}
      </div>

      {/* Line total */}
      <p className="w-16 text-right text-sm font-medium flex-shrink-0"
        style={{ color: "var(--color-pearl)", fontFamily: "var(--font-display)", fontSize: "16px" }}>
        {fmt$(price * item.quantity)}
      </p>

      {/* Remove */}
      <button onClick={() => onRemove(product._id)} disabled={isRemoving}
        className="p-1.5 transition-colors duration-150 flex-shrink-0 disabled:opacity-40"
        style={{ color: "var(--color-smoke)", background: "none", border: "none" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#c47a7a")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-smoke)")}
      >
        <X size={14} strokeWidth={1.5} />
      </button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const Cart = () => {
  const queryClient = useQueryClient();
  const navigate    = useNavigate();

  const { data: cartData, isLoading, isError } = useQuery({
    queryKey: ["cart"],
    queryFn: getCart,
  });

  const removeMutation = useMutation({
    mutationFn: removeFromCart,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["cart"] }); toast.success("Item removed"); },
    onError:   () => toast.error("Failed to remove item"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ productId, quantity }) => updateCartItem({ productId, quantity }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
    onError:   () => { queryClient.invalidateQueries({ queryKey: ["cart"] }); toast.error("Failed to update quantity"); },
  });

  const clearMutation = useMutation({
    mutationFn: clearCart,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["cart"] }); toast.success("Cart cleared"); },
    onError:   () => toast.error("Failed to clear cart"),
  });

  const checkoutMutation = useMutation({
    mutationFn: () => createOrder({ buyAll: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order placed successfully!");
      navigate("/orders");
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? "Failed to place order"),
  });

  const handleQuantityChange = (productId, quantity) => {
    if (quantity < 1) return;
    queryClient.setQueryData(["cart"], (old) => {
      if (!old) return old;
      return {
        ...old,
        items: old.items.map((item) =>
          (item.productId?._id ?? item.productId) === productId ? { ...item, quantity } : item
        ),
      };
    });
    updateMutation.mutate({ productId, quantity });
  };

  if (isLoading) return <Skeleton />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-sm" style={{ color: "#c47a7a", fontFamily: "var(--font-body)" }}>Failed to load cart</p>
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (!cartData?.items?.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-5"
        style={{ background: "var(--color-obsidian)" }}>
        <ShoppingCart size={40} strokeWidth={1} style={{ color: "var(--color-charcoal)", marginBottom: "20px" }} />
        <p style={{ fontFamily: "var(--font-display)", fontSize: "26px", fontWeight: 400, color: "var(--color-pearl)", marginBottom: "8px" }}>
          Your cart is empty
        </p>
        <p className="text-sm mb-8" style={{ color: "var(--color-smoke)", fontFamily: "var(--font-body)" }}>
          Discover our collection of rare fragrances
        </p>
        <button onClick={() => navigate("/products")}
          className="flex items-center gap-2 px-8 py-3 text-[10px] tracking-[3px] uppercase transition-all duration-200"
          style={goldBtn}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-gold-light)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--color-gold)")}
        >
          <ShoppingBag size={13} strokeWidth={1.5} /> Browse Collection
        </button>
      </div>
    );
  }

  const total     = cartData.items.reduce((s, i) => s + (i.productId?.price ?? i.price ?? 0) * i.quantity, 0);
  const itemCount = cartData.items.reduce((s, i) => s + i.quantity, 0);
  const freeShipping = total >= 150;

  return (
    <div style={{ background: "var(--color-obsidian)", minHeight: "100vh" }}>
      <div className="max-w-4xl mx-auto px-5 sm:px-8 py-10">

        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-[9px] tracking-[5px] uppercase mb-1"
              style={{ color: "var(--color-gold)", fontFamily: "var(--font-body)" }}>Your Selection</p>
            <h1 className="font-medium" style={{ fontFamily: "var(--font-display)", fontSize: "36px", color: "var(--color-pearl)" }}>
              Cart
            </h1>
          </div>
          <button onClick={() => clearMutation.mutate()} disabled={clearMutation.isPending}
            className="flex items-center gap-2 text-[10px] tracking-[2px] uppercase transition-colors duration-150 disabled:opacity-50"
            style={{ color: "var(--color-smoke)", fontFamily: "var(--font-body)", background: "none", border: "none" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#c47a7a")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-smoke)")}
          >
            <Trash2 size={12} strokeWidth={1.5} />
            {clearMutation.isPending ? "Clearing…" : "Clear all"}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── Items list ─────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0" style={{ border: "0.5px solid var(--color-charcoal)", background: "var(--color-ink)" }}>
            {/* Column headers */}
            <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-3"
              style={{ borderBottom: "0.5px solid var(--color-charcoal)" }}>
              {["Product", "Qty", "Total", ""].map((h) => (
                <span key={h} className="text-[8px] tracking-[3px] uppercase"
                  style={{ color: "var(--color-smoke)", fontFamily: "var(--font-body)" }}>{h}</span>
              ))}
            </div>

            {cartData.items.map((item, i) => (
              <div key={item.productId?._id ?? item.productId}
                style={{ borderBottom: i < cartData.items.length - 1 ? "0.5px solid var(--color-charcoal)" : "none" }}>
                <CartItemRow
                  item={item}
                  onRemove={(id) => removeMutation.mutate(id)}
                  onQuantityChange={handleQuantityChange}
                  isRemoving={removeMutation.isPending}
                />
              </div>
            ))}
          </div>

          {/* ── Order summary ──────────────────────────────────────────── */}
          <div className="w-full lg:w-72 flex-shrink-0" style={{ border: "0.5px solid var(--color-charcoal)", background: "var(--color-ink)" }}>
            <div className="p-5" style={{ borderBottom: "0.5px solid var(--color-charcoal)" }}>
              <p className="text-[9px] tracking-[4px] uppercase mb-4"
                style={{ color: "var(--color-gold)", fontFamily: "var(--font-body)" }}>Order Summary</p>

              <div className="flex flex-col gap-3">
                <div className="flex justify-between text-sm"
                  style={{ color: "var(--color-mist)", fontFamily: "var(--font-body)" }}>
                  <span>Subtotal ({itemCount} item{itemCount !== 1 ? "s" : ""})</span>
                  <span style={{ color: "var(--color-pearl)" }}>{fmt$(total)}</span>
                </div>
                <div className="flex justify-between text-sm"
                  style={{ color: "var(--color-mist)", fontFamily: "var(--font-body)" }}>
                  <span>Shipping</span>
                  <span style={{ color: freeShipping ? "#70a880" : "var(--color-pearl)" }}>
                    {freeShipping ? "Free" : fmt$(15)}
                  </span>
                </div>
              </div>

              {!freeShipping && (
                <p className="text-[10px] mt-3 leading-relaxed"
                  style={{ color: "var(--color-smoke)", fontFamily: "var(--font-body)" }}>
                  Add <span style={{ color: "var(--color-gold)" }}>{fmt$(150 - total)}</span> more for free shipping
                </p>
              )}
            </div>

            <div className="p-5" style={{ borderBottom: "0.5px solid var(--color-charcoal)" }}>
              <div className="flex justify-between items-baseline">
                <span className="text-[9px] tracking-[3px] uppercase"
                  style={{ color: "var(--color-mist)", fontFamily: "var(--font-body)" }}>Total</span>
                <span style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 500, color: "var(--color-pearl)" }}>
                  {fmt$(freeShipping ? total : total + 15)}
                </span>
              </div>
            </div>

            <div className="p-5">
              <button onClick={() => checkoutMutation.mutate()} disabled={checkoutMutation.isPending}
                className="w-full flex items-center justify-center gap-2 py-4 text-[10px] tracking-[3px] uppercase transition-all duration-200 disabled:opacity-60"
                style={goldBtn}
                onMouseEnter={(e) => { if (!checkoutMutation.isPending) e.currentTarget.style.background = "var(--color-gold-light)"; }}
                onMouseLeave={(e) => { if (!checkoutMutation.isPending) e.currentTarget.style.background = "var(--color-gold)"; }}
              >
                {checkoutMutation.isPending
                  ? "Placing order…"
                  : <><ArrowRight size={13} strokeWidth={1.5} /> Checkout</>
                }
              </button>

              <button onClick={() => navigate("/products")}
                className="w-full flex items-center justify-center gap-2 mt-3 py-3 text-[10px] tracking-[2px] uppercase transition-colors duration-150"
                style={{ color: "var(--color-smoke)", fontFamily: "var(--font-body)", background: "none", border: "none" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-mist)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-smoke)")}
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;