import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addToCart } from "../../api/cart.api";
import { addToWishlist, removeFromWishlist } from "../../api/wishlist.api";
import toast from "react-hot-toast";
import { ShoppingBag, Heart, Star, Sparkles } from "lucide-react";

const fmt$ = (v) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(v);

const CONC_LABEL = {
  "Eau de Parfum": "EDP", "Eau de Toilette": "EDT",
  "Parfum": "Parfum", "Eau de Cologne": "EDC", "Extrait": "Extrait",
};

function BottlePlaceholder() {
  return (
    <svg viewBox="0 0 80 140" className="w-12 h-20 opacity-20" fill="none">
      <rect x="30" y="6" width="20" height="12" rx="3" fill="var(--color-gold)" />
      <rect x="22" y="18" width="36" height="96" rx="8" fill="var(--color-gold)" fillOpacity=".18" />
      <rect x="22" y="18" width="36" height="96" rx="8" stroke="var(--color-gold)" strokeWidth="1" />
      <rect x="28" y="26" width="8" height="28" rx="3" fill="var(--color-gold)" fillOpacity=".2" />
    </svg>
  );
}

const ProductCard = ({ product, inCart = false, inWishlist = false }) => {
  const queryClient = useQueryClient();
  const primaryImg = product.images?.find((img) => img.isPrimary) ?? product.images?.[0];
  const brandName  = product.brand?.name ?? product.brand ?? "—";
  const isOOS      = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock < 10;
  const concShort  = CONC_LABEL[product.concentration] ?? product.concentration;

  const cartMutation = useMutation({
    mutationFn: () => addToCart({ productId: product._id, quantity: 1 }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["cart"] }); toast.success(`${product.name} added to cart`); },
    onError: (err) => toast.error(err?.response?.data?.message ?? "Failed to add to cart"),
  });

  const wishlistMutation = useMutation({
    mutationFn: () => inWishlist ? removeFromWishlist(product._id) : addToWishlist(product._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      queryClient.invalidateQueries({ queryKey: ["wishlistCount"] });
      toast.success(inWishlist ? "Removed from wishlist" : "Added to wishlist");
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? "Failed to update wishlist"),
  });

  const cartLabel = isOOS ? "Sold Out" : inCart ? "In Cart" : cartMutation.isPending ? "Adding…" : "Add to Cart";

  return (
    <div
      className="group flex flex-col overflow-hidden transition-all duration-300"
      style={{ background: "var(--color-ink)", border: "0.5px solid var(--color-charcoal)" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.35)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-charcoal)")}
    >
      {/* Image */}
      <Link
        to={`/products/${product._id}`}
        className="relative block overflow-hidden"
        style={{ aspectRatio: "1/1", background: "var(--color-obsidian)" }}
      >
        {primaryImg?.url ? (
          <img src={primaryImg.url} alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><BottlePlaceholder /></div>
        )}

        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(13,13,13,0.5) 0%, transparent 50%)" }}
        />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.isFeatured && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 text-[8px] tracking-[1px] uppercase"
              style={{ background: "var(--color-gold)", color: "var(--color-obsidian)", fontFamily: "var(--font-body)" }}>
              <Sparkles size={7} /> Featured
            </span>
          )}
          {isOOS && (
            <span className="px-1.5 py-0.5 text-[8px] tracking-[1px] uppercase"
              style={{ background: "rgba(160,60,60,0.85)", color: "#f0c0c0", fontFamily: "var(--font-body)" }}>
              Sold Out
            </span>
          )}
          {isLowStock && !isOOS && (
            <span className="px-1.5 py-0.5 text-[8px] tracking-[1px] uppercase"
              style={{ background: "rgba(100,75,20,0.85)", color: "var(--color-gold-light)", fontFamily: "var(--font-body)" }}>
              Low Stock
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={(e) => { e.preventDefault(); wishlistMutation.mutate(); }}
          disabled={wishlistMutation.isPending}
          className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center transition-all duration-200 disabled:opacity-50"
          style={{
            background: inWishlist ? "rgba(201,168,76,0.9)" : "rgba(13,13,13,0.7)",
            border: `0.5px solid ${inWishlist ? "var(--color-gold)" : "rgba(255,255,255,0.15)"}`,
            backdropFilter: "blur(8px)",
          }}
          onMouseEnter={(e) => { if (!inWishlist) e.currentTarget.style.background = "rgba(201,168,76,0.2)"; }}
          onMouseLeave={(e) => { if (!inWishlist) e.currentTarget.style.background = "rgba(13,13,13,0.7)"; }}
        >
          <Heart size={12} strokeWidth={1.5}
            style={{ color: inWishlist ? "var(--color-obsidian)" : "var(--color-mist)", fill: inWishlist ? "var(--color-obsidian)" : "none" }} />
        </button>
      </Link>

      {/* Info */}
      <div className="flex flex-col gap-1.5 p-3 flex-1">
        <p className="text-[8px] tracking-[2px] uppercase" style={{ color: "var(--color-gold)", fontFamily: "var(--font-body)" }}>
          {brandName}
        </p>

        <Link to={`/products/${product._id}`}
          className="transition-colors duration-150 line-clamp-1 leading-snug"
          style={{ fontFamily: "var(--font-display)", fontSize: "14px", fontWeight: 300, color: "var(--color-pearl)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-gold-light)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-pearl)")}
        >
          {product.name}
        </Link>

        {(product.rating || product.reviewsCount) ? (
          <div className="flex items-center gap-1">
            <Star size={9} style={{ color: "var(--color-gold)", fill: "var(--color-gold)" }} />
            <span className="text-[10px]" style={{ color: "var(--color-pearl)", fontFamily: "var(--font-body)" }}>
              {product.rating?.toFixed(1) ?? "0.0"}
            </span>
            <span className="text-[10px]" style={{ color: "var(--color-smoke)", fontFamily: "var(--font-body)" }}>
              ({product.reviewsCount ?? 0})
            </span>
          </div>
        ) : null}

        <div className="flex-1" />

        {/* Price + tags */}
        <div className="flex items-center justify-between gap-1">
          <span style={{ color: "var(--color-pearl)", fontFamily: "var(--font-display)", fontSize: "15px", fontWeight: 300 }}>
            {fmt$(product.price)}
          </span>
          <div className="flex gap-1">
            {concShort && (
              <span className="text-[8px] tracking-[1px] px-1.5 py-0.5"
                style={{ color: "var(--color-gold)", border: "0.5px solid rgba(201,168,76,0.3)", fontFamily: "var(--font-body)" }}>
                {concShort}
              </span>
            )}
            {product.gender && (
              <span className="text-[8px] tracking-[1px] px-1.5 py-0.5"
                style={{ color: "var(--color-mist)", border: "0.5px solid var(--color-charcoal)", fontFamily: "var(--font-body)" }}>
                {product.gender}
              </span>
            )}
          </div>
        </div>

        {/* Cart button */}
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
          <ShoppingBag size={11} strokeWidth={1.5} />
          {cartLabel}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;