import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { getWishlist, removeFromWishlist, clearWishlist } from "../../api/wishlist.api";
import { getCart, addToCart } from "../../api/cart.api";
import toast from "react-hot-toast";
import {
  Heart, Trash2, X, ImageIcon, ShoppingBag, ShoppingCart,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt$ = (v) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(v);

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10">
      <div className="h-4 w-32 mb-8 animate-pulse" style={{ background: "var(--color-charcoal)" }} />
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse overflow-hidden"
            style={{ background: "var(--color-ink)", border: "0.5px solid var(--color-charcoal)" }}>
            <div className="aspect-square" style={{ background: "var(--color-charcoal)" }} />
            <div className="p-3 space-y-2">
              <div className="h-2 w-14" style={{ background: "var(--color-charcoal)" }} />
              <div className="h-3 w-3/4" style={{ background: "var(--color-charcoal)" }} />
              <div className="h-7 w-full" style={{ background: "var(--color-charcoal)" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Wishlist Item Card ───────────────────────────────────────────────────────

function WishlistCard({ item, cartIds, onRemove }) {
  const queryClient = useQueryClient();
  const product     = item.productId;
  const primaryImg  = product?.images?.find((img) => img.isPrimary) ?? product?.images?.[0];
  const name        = product?.name        ?? "Unknown product";
  const price       = product?.price       ?? 0;
  const brandName   = product?.brand?.name ?? product?.brand ?? "—";
  const isOOS       = product?.stock === 0;
  const inCart      = cartIds.has(product?._id);

  const cartMutation = useMutation({
    mutationFn: () => addToCart({ productId: product._id, quantity: 1 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success(`${name} added to cart`);
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? "Failed to add to cart"),
  });

  const cartLabel = isOOS ? "Sold Out"
    : inCart ? "In Cart"
    : cartMutation.isPending ? "Adding…"
    : "Add to Cart";

  return (
    <div className="group flex flex-col overflow-hidden transition-all duration-300"
      style={{ background: "var(--color-ink)", border: "0.5px solid var(--color-charcoal)" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.35)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-charcoal)")}
    >
      {/* Image */}
      <Link to={`/products/${product?._id}`}
        className="relative block overflow-hidden"
        style={{ aspectRatio: "1/1", background: "var(--color-obsidian)" }}
      >
        {primaryImg?.url
          ? <img src={primaryImg.url} alt={name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          : <div className="w-full h-full flex items-center justify-center">
              <ImageIcon size={28} strokeWidth={1} style={{ color: "var(--color-charcoal)" }} />
            </div>
        }

        {/* Gradient */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(13,13,13,0.5) 0%, transparent 50%)" }} />

        {/* Sold Out badge */}
        {isOOS && (
          <span className="absolute top-2 left-2 px-2 py-0.5 text-[8px] tracking-[1px] uppercase"
            style={{ background: "rgba(160,60,60,0.85)", color: "#f0c0c0", fontFamily: "var(--font-body)" }}>
            Sold Out
          </span>
        )}

        {/* Remove button */}
        <button
          onClick={(e) => { e.preventDefault(); onRemove(product._id); }}
          className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center transition-all duration-200"
          style={{ background: "rgba(13,13,13,0.7)", border: "0.5px solid rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(180,60,60,0.7)"; e.currentTarget.style.borderColor = "rgba(200,80,80,0.5)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(13,13,13,0.7)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
        >
          <X size={12} strokeWidth={1.5} style={{ color: "var(--color-mist)" }} />
        </button>
      </Link>

      {/* Info */}
      <div className="flex flex-col gap-1.5 p-3 flex-1">
        <p className="text-[8px] tracking-[2px] uppercase"
          style={{ color: "var(--color-gold)", fontFamily: "var(--font-body)" }}>{brandName}</p>

        <Link to={`/products/${product?._id}`}
          className="transition-colors duration-150 line-clamp-1 text-sm font-medium"
          style={{ color: "var(--color-pearl)", fontFamily: "var(--font-body)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-gold-light)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-pearl)")}
        >{name}</Link>

        <div className="flex-1" />

        <p style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 400, color: "var(--color-pearl)" }}>
          {fmt$(price)}
        </p>

        <button
          onClick={() => cartMutation.mutate()}
          disabled={cartMutation.isPending || inCart || isOOS}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-[9px] tracking-[2px] uppercase transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            fontFamily: "var(--font-body)",
            ...(isOOS
              ? { background: "transparent", color: "var(--color-smoke)", border: "0.5px solid var(--color-charcoal)", cursor: "not-allowed" }
              : inCart
              ? { background: "rgba(201,168,76,0.1)", color: "var(--color-gold)", border: "0.5px solid rgba(201,168,76,0.3)", cursor: "default" }
              : { background: "var(--color-gold)", color: "var(--color-obsidian)", border: "0.5px solid var(--color-gold)" }),
          }}
          onMouseEnter={(e) => { if (!isOOS && !inCart && !cartMutation.isPending) e.currentTarget.style.background = "var(--color-gold-light)"; }}
          onMouseLeave={(e) => { if (!isOOS && !inCart && !cartMutation.isPending) e.currentTarget.style.background = "var(--color-gold)"; }}
        >
          <ShoppingCart size={11} strokeWidth={1.5} />
          {cartLabel}
        </button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const Wishlist = () => {
  const queryClient = useQueryClient();
  const navigate    = useNavigate();

  const { data: items, isLoading, isError } = useQuery({
    queryKey: ["wishlist"],
    queryFn: getWishlist,
  });

  const { data: cart } = useQuery({ queryKey: ["cart"], queryFn: getCart });
  const cartIds = new Set(cart?.items?.map((i) => i.productId?._id ?? i.productId) ?? []);

  const removeMutation = useMutation({
    mutationFn: removeFromWishlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      queryClient.invalidateQueries({ queryKey: ["wishlistCount"] });
      toast.success("Removed from wishlist");
    },
    onError: () => toast.error("Failed to remove item"),
  });

  const clearMutation = useMutation({
    mutationFn: clearWishlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      queryClient.invalidateQueries({ queryKey: ["wishlistCount"] });
      toast.success("Wishlist cleared");
    },
    onError: () => toast.error("Failed to clear wishlist"),
  });

  if (isLoading) return <Skeleton />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-sm" style={{ color: "#c47a7a", fontFamily: "var(--font-body)" }}>Failed to load wishlist</p>
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (!items?.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-5"
        style={{ background: "var(--color-obsidian)" }}>
        <Heart size={40} strokeWidth={1} style={{ color: "var(--color-charcoal)", marginBottom: "20px" }} />
        <p style={{ fontFamily: "var(--font-display)", fontSize: "26px", fontWeight: 400, color: "var(--color-pearl)", marginBottom: "8px" }}>
          Your wishlist is empty
        </p>
        <p className="text-sm mb-8" style={{ color: "var(--color-smoke)", fontFamily: "var(--font-body)" }}>
          Save fragrances you love and find them here
        </p>
        <button onClick={() => navigate("/products")}
          className="flex items-center gap-2 px-8 py-3 text-[10px] tracking-[3px] uppercase transition-all duration-200"
          style={{ background: "var(--color-gold)", color: "var(--color-obsidian)", border: "0.5px solid var(--color-gold)", fontFamily: "var(--font-body)", borderRadius: "0" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-gold-light)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--color-gold)")}
        >
          <ShoppingBag size={13} strokeWidth={1.5} /> Browse Collection
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--color-obsidian)", minHeight: "100vh" }}>
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10">

        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-[9px] tracking-[5px] uppercase mb-1"
              style={{ color: "var(--color-gold)", fontFamily: "var(--font-body)" }}>Saved Items</p>
            <h1 className="font-medium" style={{ fontFamily: "var(--font-display)", fontSize: "36px", color: "var(--color-pearl)" }}>
              Wishlist
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm" style={{ color: "var(--color-smoke)", fontFamily: "var(--font-body)" }}>
              {items.length} item{items.length !== 1 ? "s" : ""}
            </span>
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
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {items.map((item) => (
            <WishlistCard
              key={item.productId?._id ?? item._id}
              item={item}
              cartIds={cartIds}
              onRemove={(id) => removeMutation.mutate(id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Wishlist;