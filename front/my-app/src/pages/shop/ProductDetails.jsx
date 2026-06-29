import { useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  ChevronLeft, ChevronRight, Star, ShoppingBag, Zap,
  CheckCircle2, AlertTriangle, Minus, Plus, ImageIcon,
  Heart, Send, Pencil, Trash2, X,
} from "lucide-react";
import toast from "react-hot-toast";

import { getProduct }                                                from "../../api/product.api";
import { createOrder }                                               from "../../api/order.api";
import { addToCart }                                                 from "../../api/cart.api";
import { addToWishlist, removeFromWishlist, getWishlist }            from "../../api/wishlist.api";
import { getProductReviews, addReview, updateReview, deleteReview }  from "../../api/review.api";
import AuthContext                                                    from "../../context/AuthContext.jsx";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt$ = (v) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(v);

const SORT_OPTIONS = [
  { value: "",        label: "Most Recent"   },
  { value: "highest", label: "Highest Rated" },
  { value: "lowest",  label: "Lowest Rated"  },
  { value: "oldest",  label: "Oldest First"  },
];

// ─── Shared style objects ─────────────────────────────────────────────────────

const goldBtn = {
  background: "var(--color-gold)", color: "var(--color-obsidian)",
  border: "0.5px solid var(--color-gold)", fontFamily: "var(--font-body)", borderRadius: "0",
};
const outlineBtn = {
  background: "transparent", color: "var(--color-pearl)",
  border: "0.5px solid var(--color-charcoal)", fontFamily: "var(--font-body)", borderRadius: "0",
};

// ─── Star Rating Input ────────────────────────────────────────────────────────

function StarInput({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform duration-100 hover:scale-110"
        >
          <Star size={22} strokeWidth={1.5} style={{
            color: n <= (hovered || value) ? "var(--color-gold)" : "var(--color-charcoal)",
            fill:  n <= (hovered || value) ? "var(--color-gold)" : "transparent",
            transition: "color .15s, fill .15s",
          }} />
        </button>
      ))}
    </div>
  );
}

// ─── Star Display ─────────────────────────────────────────────────────────────

function StarDisplay({ rating, size = 13 }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} strokeWidth={1.5} style={{
          color: n <= rating ? "var(--color-gold)" : "var(--color-charcoal)",
          fill:  n <= rating ? "var(--color-gold)" : "transparent",
        }} />
      ))}
    </div>
  );
}

// ─── Rating Distribution Bar ──────────────────────────────────────────────────

function RatingBar({ star, count, total }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] w-3 text-right flex-shrink-0"
        style={{ color: "var(--color-mist)", fontFamily: "var(--font-body)" }}>{star}</span>
      <Star size={9} style={{ color: "var(--color-gold)", fill: "var(--color-gold)", flexShrink: 0 }} />
      <div className="flex-1 h-px overflow-hidden" style={{ background: "var(--color-charcoal)" }}>
        <div className="h-full transition-all duration-500" style={{ width: `${pct}%`, background: "var(--color-gold)" }} />
      </div>
      <span className="text-[11px] w-5 flex-shrink-0"
        style={{ color: "var(--color-smoke)", fontFamily: "var(--font-body)" }}>{count}</span>
    </div>
  );
}

// ─── Image Gallery ────────────────────────────────────────────────────────────

function ImageGallery({ images = [] }) {
  const [activeIdx, setActiveIdx] = useState(() => {
    const i = images.findIndex((img) => img.isPrimary);
    return i >= 0 ? i : 0;
  });
  const active = images[activeIdx];
  const prev   = () => setActiveIdx((i) => (i - 1 + images.length) % images.length);
  const next   = () => setActiveIdx((i) => (i + 1) % images.length);

  return (
    <div className="flex flex-col gap-3 sticky top-20">
      <div className="relative overflow-hidden"
        style={{ aspectRatio: "1/1", background: "var(--color-ink)", border: "0.5px solid var(--color-charcoal)" }}>
        {active?.url
          ? <img src={active.url} alt="Product" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center">
              <ImageIcon size={40} strokeWidth={1} style={{ color: "var(--color-charcoal)" }} />
            </div>
        }
        {images.length > 1 && (
          <>
            {[{ fn: prev, side: "left-3", Icon: ChevronLeft }, { fn: next, side: "right-3", Icon: ChevronRight }].map(({ fn, side, Icon }) => (
              <button key={side} onClick={fn}
                className={`absolute ${side} top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center transition-all duration-200`}
                style={{ background: "rgba(13,13,13,0.7)", border: "0.5px solid var(--color-charcoal)", backdropFilter: "blur(8px)" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-gold)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-charcoal)")}
              >
                <Icon size={14} strokeWidth={1.5} style={{ color: "var(--color-mist)" }} />
              </button>
            ))}
            <span className="absolute bottom-3 right-3 text-[10px] tracking-[1px] px-2 py-1"
              style={{ background: "rgba(13,13,13,0.8)", color: "var(--color-mist)", fontFamily: "var(--font-body)" }}>
              {activeIdx + 1} / {images.length}
            </span>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button key={i} onClick={() => setActiveIdx(i)}
              className="flex-shrink-0 w-14 h-14 overflow-hidden transition-all duration-200"
              style={{ border: `0.5px solid ${i === activeIdx ? "var(--color-gold)" : "var(--color-charcoal)"}`, opacity: i === activeIdx ? 1 : 0.45 }}
            >
              {img.url
                ? <img src={img.url} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full" style={{ background: "var(--color-ink)" }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Option B: Horizontal strip + numbered notes ──────────────────────────────

function ProductMeta({ product }) {
  const concShort = {
    "Eau de Parfum": "EDP", "Eau de Toilette": "EDT",
    "Parfum": "Parfum", "Eau de Cologne": "EDC", "Extrait": "Extrait",
  }[product.concentration] ?? product.concentration;

  return (
    <div className="flex flex-col gap-4">

      {/* ── Horizontal strip: Concentration · Gender · Season ── */}
      <div className="flex overflow-hidden" style={{ border: "0.5px solid var(--color-charcoal)" }}>
        {[
          { cat: "Concentration", val: concShort,        gold: true  },
          { cat: "Gender",        val: product.gender,   gold: false },
          { cat: "Season",        val: product.season,   gold: false },
        ].filter((r) => r.val).map(({ cat, val, gold }, i, arr) => (
          <div key={cat}
            className="flex-1 flex flex-col items-center justify-center gap-1.5 py-4 px-2 text-center transition-colors duration-200"
            style={{ borderRight: i < arr.length - 1 ? "0.5px solid var(--color-charcoal)" : "none" }}
          >
            <span className="text-[8px] tracking-[2px] uppercase"
              style={{ color: "var(--color-mist)", fontFamily: "var(--font-body)" }}>{cat}</span>
            <span className="text-sm font-medium"
              style={{ color: gold ? "var(--color-gold)" : "var(--color-pearl)", fontFamily: "var(--font-body)", letterSpacing: "0.5px" }}>
              {val}
            </span>
          </div>
        ))}
      </div>

      {/* ── Scent family chips ── */}
      {product.scentType?.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[8px] tracking-[3px] uppercase flex-shrink-0"
            style={{ color: "var(--color-mist)", fontFamily: "var(--font-body)" }}>Scent</span>
          <div className="flex flex-wrap gap-2">
            {product.scentType.map((s) => (
              <span key={s} className="text-[9px] tracking-[2px] uppercase px-3 py-1"
                style={{ color: "var(--color-gold)", border: "0.5px solid rgba(201,168,76,0.25)", fontFamily: "var(--font-body)" }}>
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Fragrance Notes — numbered list ── */}
      {product.notes?.length > 0 && (
        <div>
          <p className="text-[8px] tracking-[4px] uppercase mb-3"
            style={{ color: "var(--color-gold)", fontFamily: "var(--font-body)" }}>Fragrance Notes</p>
          <div className="flex flex-col" style={{ border: "0.5px solid var(--color-charcoal)" }}>
            {product.notes.map((note, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3"
                style={{ borderBottom: i < product.notes.length - 1 ? "0.5px solid var(--color-charcoal)" : "none" }}>
                {/* Number */}
                <span className="font-light flex-shrink-0"
                  style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontStyle: "italic", color: "var(--color-gold)", opacity: 0.6, minWidth: "24px" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                {/* Optional image */}
                {note.image?.url && (
                  <img src={note.image.url} alt={note.text}
                    className="w-7 h-7 object-cover flex-shrink-0"
                    style={{ borderRadius: "50%", border: "0.5px solid var(--color-charcoal)" }} />
                )}
                {/* Name */}
                <span className="text-sm font-medium"
                  style={{ color: "var(--color-pearl)", fontFamily: "var(--font-body)", letterSpacing: "0.3px" }}>
                  {note.text}
                </span>
                {/* Gold dot */}
                <span className="ml-auto flex-shrink-0" style={{
                  width: "4px", height: "4px", borderRadius: "50%",
                  background: "var(--color-gold)", opacity: 0.4,
                }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Review Card ──────────────────────────────────────────────────────────────

function ReviewCard({ review, currentUserId, onEdit, onDelete }) {
  const isOwner = currentUserId && review.userId?._id === currentUserId;
  const date    = new Date(review.createdAt).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
  return (
    <div className="flex flex-col gap-3 p-4"
      style={{ border: "0.5px solid var(--color-charcoal)", background: "var(--color-ink)" }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium uppercase flex-shrink-0"
            style={{ background: "rgba(201,168,76,0.1)", border: "0.5px solid var(--color-gold-dark)", color: "var(--color-gold)", fontFamily: "var(--font-body)" }}>
            {review.userId?.name?.[0] ?? "?"}
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--color-pearl)", fontFamily: "var(--font-body)" }}>
              {review.userId?.name ?? "Anonymous"}
            </p>
            <p className="text-[11px]" style={{ color: "var(--color-smoke)", fontFamily: "var(--font-body)" }}>
              {date}{review.isEdited && <span className="ml-2">· edited</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StarDisplay rating={review.rating} />
          {isOwner && (
            <div className="flex gap-1">
              {[{ Icon: Pencil, fn: () => onEdit(review), hoverColor: "var(--color-gold)" },
                { Icon: Trash2, fn: () => onDelete(review._id), hoverColor: "#c47a7a" }].map(({ Icon, fn, hoverColor }) => (
                <button key={hoverColor} onClick={fn}
                  className="p-1.5 transition-colors duration-150"
                  style={{ color: "var(--color-smoke)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = hoverColor)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-smoke)")}
                ><Icon size={12} strokeWidth={1.5} /></button>
              ))}
            </div>
          )}
        </div>
      </div>
      <p className="text-sm leading-relaxed" style={{ color: "var(--color-mist)", fontFamily: "var(--font-body)" }}>
        {review.comment}
      </p>
    </div>
  );
}

// ─── Reviews Section ──────────────────────────────────────────────────────────

function ReviewsSection({ productId, productRating, reviewsCount }) {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();

  const [page,    setPage]    = useState(1);
  const [sortBy,  setSortBy]  = useState("");
  const [editing, setEditing] = useState(null);
  const [formRating,  setFormRating]  = useState(0);
  const [formComment, setFormComment] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["reviews", productId, page, sortBy],
    queryFn:  () => getProductReviews(productId, { page, limit: 5, sortBy: sortBy || undefined }),
    placeholderData: keepPreviousData,
  });

  const reviews      = data?.data            ?? [];
  const distribution = data?.ratingDistribution ?? {};
  const totalPages   = data?.pagination?.totalPages ?? 1;
  const totalItems   = data?.pagination?.totalItems ?? 0;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
    queryClient.invalidateQueries({ queryKey: ["product", productId] });
  };

  const addMutation = useMutation({
    mutationFn: addReview,
    onSuccess: () => { invalidate(); setFormRating(0); setFormComment(""); toast.success("Review added!"); },
    onError: (err) => toast.error(err?.response?.data?.message ?? "Failed to add review"),
  });

  const updateMutation = useMutation({
    mutationFn: updateReview,
    onSuccess: () => { invalidate(); setEditing(null); setFormRating(0); setFormComment(""); toast.success("Review updated!"); },
    onError: (err) => toast.error(err?.response?.data?.message ?? "Failed to update review"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteReview,
    onSuccess: () => { invalidate(); toast.success("Review deleted"); },
    onError: (err) => toast.error(err?.response?.data?.message ?? "Failed to delete review"),
  });

  const handleEdit = (review) => {
    setEditing(review); setFormRating(review.rating); setFormComment(review.comment);
    setTimeout(() => document.getElementById("review-form")?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formRating)        return toast.error("Please select a rating");
    if (!formComment.trim()) return toast.error("Please write a comment");
    if (editing) updateMutation.mutate({ reviewId: editing._id, rating: formRating, comment: formComment.trim() });
    else         addMutation.mutate({ productId, rating: formRating, comment: formComment.trim() });
  };

  const isBusy = addMutation.isPending || updateMutation.isPending;

  return (
    <div className="mt-16 pt-12" style={{ borderTop: "0.5px solid var(--color-charcoal)" }}>
      <p className="text-[9px] tracking-[5px] uppercase mb-2"
        style={{ color: "var(--color-gold)", fontFamily: "var(--font-body)" }}>Customer Reviews</p>
      <h2 className="text-3xl font-light mb-10"
        style={{ fontFamily: "var(--font-display)", color: "var(--color-pearl)" }}>What they say</h2>

      {/* Rating overview */}
      {reviewsCount > 0 && (
        <div className="flex flex-col sm:flex-row gap-8 p-6 mb-8"
          style={{ background: "var(--color-ink)", border: "0.5px solid var(--color-charcoal)" }}>
          <div className="flex flex-col items-center justify-center gap-2 sm:pr-8"
            style={{ borderRight: "0.5px solid var(--color-charcoal)" }}>
            <span className="text-5xl font-light"
              style={{ fontFamily: "var(--font-display)", color: "var(--color-pearl)" }}>
              {productRating?.toFixed(1) ?? "0.0"}
            </span>
            <StarDisplay rating={Math.round(productRating ?? 0)} size={14} />
            <span className="text-[10px] tracking-[1px]"
              style={{ color: "var(--color-smoke)", fontFamily: "var(--font-body)" }}>
              {totalItems} reviews
            </span>
          </div>
          <div className="flex-1 flex flex-col gap-2 justify-center">
            {[5, 4, 3, 2, 1].map((s) => (
              <RatingBar key={s} star={s} count={distribution[s] ?? 0} total={totalItems} />
            ))}
          </div>
        </div>
      )}

      {/* Review form */}
      {user ? (
        <div id="review-form" className="p-5 mb-8"
          style={{ background: "var(--color-ink)", border: "0.5px solid var(--color-charcoal)" }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[9px] tracking-[3px] uppercase"
              style={{ color: "var(--color-gold)", fontFamily: "var(--font-body)" }}>
              {editing ? "Edit Review" : "Write a Review"}
            </p>
            {editing && (
              <button onClick={() => { setEditing(null); setFormRating(0); setFormComment(""); }}
                className="flex items-center gap-1 text-[10px] tracking-[1px] uppercase"
                style={{ color: "var(--color-smoke)", fontFamily: "var(--font-body)", background: "none", border: "none" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-mist)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-smoke)")}
              ><X size={11} strokeWidth={1.5} /> Cancel</button>
            )}
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <p className="text-[9px] tracking-[2px] uppercase mb-2"
                style={{ color: "var(--color-mist)", fontFamily: "var(--font-body)" }}>Your Rating</p>
              <StarInput value={formRating} onChange={setFormRating} />
            </div>
            <div>
              <p className="text-[9px] tracking-[2px] uppercase mb-2"
                style={{ color: "var(--color-mist)", fontFamily: "var(--font-body)" }}>Your Review</p>
              <textarea rows={3} placeholder="Share your experience with this fragrance..."
                value={formComment} onChange={(e) => setFormComment(e.target.value)}
                className="w-full resize-none outline-none text-sm leading-relaxed px-3 py-2.5 transition-colors duration-200"
                style={{ background: "var(--color-charcoal)", border: "0.5px solid var(--color-smoke)", color: "var(--color-pearl)", fontFamily: "var(--font-body)", borderRadius: "0" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-gold)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-smoke)")}
              />
            </div>
            <button type="submit" disabled={isBusy}
              className="self-end flex items-center gap-2 px-6 py-2.5 text-[10px] tracking-[2px] uppercase transition-all duration-200 disabled:opacity-50"
              style={goldBtn}
              onMouseEnter={(e) => { if (!isBusy) e.currentTarget.style.background = "var(--color-gold-light)"; }}
              onMouseLeave={(e) => { if (!isBusy) e.currentTarget.style.background = "var(--color-gold)"; }}
            >
              <Send size={11} strokeWidth={1.5} />
              {isBusy ? "Submitting…" : editing ? "Update Review" : "Submit Review"}
            </button>
          </form>
        </div>
      ) : (
        <div className="p-5 mb-8 text-center"
          style={{ background: "var(--color-ink)", border: "0.5px solid var(--color-charcoal)" }}>
          <p className="text-sm mb-3" style={{ color: "var(--color-mist)", fontFamily: "var(--font-body)" }}>
            Sign in to share your experience
          </p>
          <a href="/login" className="inline-block px-6 py-2 text-[10px] tracking-[2px] uppercase transition-all duration-200" style={goldBtn}>
            Sign In
          </a>
        </div>
      )}

      {/* Reviews list */}
      {reviewsCount > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4 pb-4"
            style={{ borderBottom: "0.5px solid var(--color-charcoal)" }}>
            <span className="text-[11px] tracking-[1px]"
              style={{ color: "var(--color-smoke)", fontFamily: "var(--font-body)" }}>
              {totalItems} review{totalItems !== 1 ? "s" : ""}
            </span>
            <div className="relative">
              <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                className="appearance-none text-[10px] tracking-[1px] outline-none pl-3 pr-7 py-1.5"
                style={{ background: "var(--color-charcoal)", border: "0.5px solid var(--color-smoke)", color: "var(--color-mist)", fontFamily: "var(--font-body)", borderRadius: "0", cursor: "pointer" }}
              >
                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <ChevronRight size={10} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none rotate-90"
                style={{ color: "var(--color-smoke)" }} />
            </div>
          </div>

          {isLoading
            ? <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 animate-pulse"
                    style={{ background: "var(--color-ink)", border: "0.5px solid var(--color-charcoal)" }} />
                ))}
              </div>
            : <div className="flex flex-col gap-3">
                {reviews.map((r) => (
                  <ReviewCard key={r._id} review={r}
                    currentUserId={user?._id ?? user?.id}
                    onEdit={handleEdit}
                    onDelete={(id) => deleteMutation.mutate(id)}
                  />
                ))}
              </div>
          }

          {totalPages > 1 && (
            <div className="flex justify-center gap-1.5 mt-8">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)}
                  className="w-8 h-8 flex items-center justify-center text-[11px] transition-all duration-200"
                  style={p === page
                    ? { background: "var(--color-gold)", color: "var(--color-obsidian)", border: "0.5px solid var(--color-gold)", fontFamily: "var(--font-body)" }
                    : { background: "transparent", color: "var(--color-mist)", border: "0.5px solid var(--color-charcoal)", fontFamily: "var(--font-body)" }}
                  onMouseEnter={(e) => { if (p !== page) { e.currentTarget.style.borderColor = "var(--color-gold)"; e.currentTarget.style.color = "var(--color-gold)"; } }}
                  onMouseLeave={(e) => { if (p !== page) { e.currentTarget.style.borderColor = "var(--color-charcoal)"; e.currentTarget.style.color = "var(--color-mist)"; } }}
                >{p}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {!isLoading && reviewsCount === 0 && (
        <div className="py-16 text-center" style={{ border: "0.5px solid var(--color-charcoal)" }}>
          <Star size={28} strokeWidth={1} style={{ color: "var(--color-charcoal)", margin: "0 auto 12px" }} />
          <p style={{ color: "var(--color-mist)", fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 300 }}>
            No reviews yet
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--color-smoke)", fontFamily: "var(--font-body)" }}>
            Be the first to share your experience
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10">
      <div className="h-3 w-20 mb-10 animate-pulse" style={{ background: "var(--color-charcoal)" }} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="aspect-square animate-pulse" style={{ background: "var(--color-ink)" }} />
        <div className="space-y-5">
          {[60, 200, 80, 120, 100, 160].map((w, i) => (
            <div key={i} className="h-4 animate-pulse" style={{ background: "var(--color-ink)", width: `${w}px` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const ProductDetails = () => {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const queryClient  = useQueryClient();
  const { user }     = useContext(AuthContext);
  const [quantity, setQuantity] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["product", id],
    queryFn:  () => getProduct(id),
    enabled:  !!id,
  });
  const product = data?.data ?? null;

  const { data: wishlist } = useQuery({
    queryKey: ["wishlist"],
    queryFn:  getWishlist,
    enabled:  !!user,
  });
  const inWishlist = wishlist?.some((w) => (w.productId?._id ?? w.productId) === id) ?? false;

  const cartMutation = useMutation({
    mutationFn: () => addToCart({ productId: product._id, quantity }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["cart"] }); toast.success("Added to cart"); },
    onError:   (err) => toast.error(err?.response?.data?.message ?? "Failed to add to cart"),
  });

  const buyNowMutation = useMutation({
    mutationFn: () => createOrder({ buyNowProductId: product._id, buyNowQuantity: quantity }),
    onSuccess: () => navigate("/orders"),
    onError:   (err) => toast.error(err?.response?.data?.message ?? "Failed to place order"),
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

  const isBusy    = cartMutation.isPending || buyNowMutation.isPending;
  const outOfStock = product?.stock === 0;
  const isLowStock = product?.stock > 0 && product?.stock < 10;
  const brandName  = product?.brand?.name ?? product?.brand ?? "—";

  if (isLoading) return <Skeleton />;

  if (isError || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-5">
        <AlertTriangle size={36} strokeWidth={1} style={{ color: "var(--color-smoke)", marginBottom: "16px" }} />
        <p style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 300, color: "var(--color-mist)" }}>
          Product not found
        </p>
        <button onClick={() => navigate(-1)}
          className="mt-6 px-6 py-2.5 text-[10px] tracking-[3px] uppercase transition-all duration-200"
          style={goldBtn}>Go Back</button>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--color-obsidian)", minHeight: "100vh" }}>
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10">

        {/* Back */}
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 mb-10 transition-colors duration-150"
          style={{ color: "var(--color-mist)", fontFamily: "var(--font-body)", fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", background: "none", border: "none" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-gold)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-mist)")}
        >
          <ChevronLeft size={14} strokeWidth={1.5} /> Collections
        </button>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">

          <ImageGallery images={product.images} />

          <div className="flex flex-col gap-6">

            {/* Brand + name */}
            <div>
              <p className="text-[10px] tracking-[4px] uppercase mb-2"
                style={{ color: "var(--color-gold)", fontFamily: "var(--font-body)" }}>{brandName}</p>
              <h1 className="font-medium leading-tight mb-4"
                style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px,4vw,48px)", color: "var(--color-pearl)" }}>
                {product.name}
              </h1>
              <div className="flex items-center gap-3">
                <StarDisplay rating={Math.round(product.rating ?? 0)} size={15} />
                <span className="text-sm font-medium" style={{ color: "var(--color-pearl)", fontFamily: "var(--font-body)" }}>
                  {product.rating?.toFixed(1) ?? "0.0"}
                </span>
                <span className="text-sm" style={{ color: "var(--color-smoke)", fontFamily: "var(--font-body)" }}>
                  ({product.reviewsCount ?? 0} reviews)
                </span>
              </div>
            </div>

            {/* Price */}
            <div style={{ borderTop: "0.5px solid var(--color-charcoal)", borderBottom: "0.5px solid var(--color-charcoal)", padding: "18px 0" }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: "40px", fontWeight: 500, color: "var(--color-pearl)", letterSpacing: "1px" }}>
                {fmt$(product.price)}
              </span>
            </div>

            {/* Meta: strip + notes */}
            <ProductMeta product={product} />

            {/* Stock */}
            <div>
              {outOfStock
                ? <span className="inline-flex items-center gap-2 px-3 py-2 text-[10px] tracking-[1px] uppercase"
                    style={{ background: "rgba(160,60,60,0.12)", color: "#c08080", border: "0.5px solid rgba(160,60,60,0.3)", fontFamily: "var(--font-body)" }}>
                    <AlertTriangle size={11} strokeWidth={1.5} /> Out of Stock
                  </span>
                : isLowStock
                ? <span className="inline-flex items-center gap-2 px-3 py-2 text-[10px] tracking-[1px] uppercase"
                    style={{ background: "rgba(100,75,20,0.15)", color: "var(--color-gold-light)", border: "0.5px solid rgba(201,168,76,0.2)", fontFamily: "var(--font-body)" }}>
                    <AlertTriangle size={11} strokeWidth={1.5} /> Only {product.stock} left
                  </span>
                : <span className="inline-flex items-center gap-2 px-3 py-2 text-[10px] tracking-[1px] uppercase"
                    style={{ background: "rgba(30,80,50,0.15)", color: "#70a880", border: "0.5px solid rgba(60,120,80,0.25)", fontFamily: "var(--font-body)" }}>
                    <CheckCircle2 size={11} strokeWidth={1.5} /> In Stock
                  </span>
              }
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-sm leading-relaxed"
                style={{ color: "var(--color-mist)", fontFamily: "var(--font-body)", fontSize: "14px" }}>
                {product.description}
              </p>
            )}

            {/* Quantity */}
            {!outOfStock && (
              <div className="flex items-center gap-4">
                <span className="text-[9px] tracking-[3px] uppercase"
                  style={{ color: "var(--color-mist)", fontFamily: "var(--font-body)" }}>Quantity</span>
                <div className="flex items-center" style={{ border: "0.5px solid var(--color-charcoal)" }}>
                  {[
                    { Icon: Minus, fn: () => setQuantity((q) => Math.max(1, q - 1)),            disabled: quantity <= 1              },
                    { Icon: Plus,  fn: () => setQuantity((q) => Math.min(product.stock, q + 1)), disabled: quantity >= product.stock  },
                  ].map(({ Icon, fn, disabled }, idx) => (
                    <button key={idx} onClick={fn} disabled={disabled}
                      className="w-10 h-10 flex items-center justify-center transition-colors duration-150 disabled:opacity-30"
                      style={{ color: "var(--color-mist)", background: "transparent", border: "none",
                        borderRight: idx === 0 ? "0.5px solid var(--color-charcoal)" : "none",
                        borderLeft:  idx === 1 ? "0.5px solid var(--color-charcoal)" : "none",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-charcoal)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    ><Icon size={13} strokeWidth={1.5} /></button>
                  )).flatMap((btn, i) => i === 0
                    ? [btn, <span key="val" className="w-12 text-center text-sm font-medium"
                        style={{ color: "var(--color-pearl)", fontFamily: "var(--font-body)" }}>{quantity}</span>]
                    : [btn]
                  )}
                </div>
              </div>
            )}

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => cartMutation.mutate()} disabled={isBusy || outOfStock}
                className="flex-1 flex items-center justify-center gap-2 py-4 text-[10px] tracking-[3px] uppercase transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                style={outlineBtn}
                onMouseEnter={(e) => { if (!isBusy && !outOfStock) { e.currentTarget.style.borderColor = "var(--color-gold)"; e.currentTarget.style.color = "var(--color-gold)"; } }}
                onMouseLeave={(e) => { if (!isBusy && !outOfStock) { e.currentTarget.style.borderColor = "var(--color-charcoal)"; e.currentTarget.style.color = "var(--color-pearl)"; } }}
              >
                <ShoppingBag size={14} strokeWidth={1.5} />
                {cartMutation.isPending ? "Adding…" : "Add to Cart"}
              </button>
              <button onClick={() => buyNowMutation.mutate()} disabled={isBusy || outOfStock}
                className="flex-1 flex items-center justify-center gap-2 py-4 text-[10px] tracking-[3px] uppercase transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                style={goldBtn}
                onMouseEnter={(e) => { if (!isBusy && !outOfStock) e.currentTarget.style.background = "var(--color-gold-light)"; }}
                onMouseLeave={(e) => { if (!isBusy && !outOfStock) e.currentTarget.style.background = "var(--color-gold)"; }}
              >
                <Zap size={14} strokeWidth={1.5} />
                {buyNowMutation.isPending ? "Placing order…" : "Buy Now"}
              </button>
            </div>

            {/* Wishlist */}
            {user && (
              <button onClick={() => wishlistMutation.mutate()} disabled={wishlistMutation.isPending}
                className="flex items-center gap-2 self-start text-[10px] tracking-[2px] uppercase transition-colors duration-150"
                style={{ color: inWishlist ? "var(--color-gold)" : "var(--color-smoke)", fontFamily: "var(--font-body)", background: "none", border: "none" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-gold)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = inWishlist ? "var(--color-gold)" : "var(--color-smoke)")}
              >
                <Heart size={13} strokeWidth={1.5}
                  style={{ fill: inWishlist ? "var(--color-gold)" : "none", color: "inherit" }} />
                {inWishlist ? "Saved to Wishlist" : "Add to Wishlist"}
              </button>
            )}

            {/* Meta row */}
            <div className="grid grid-cols-2 gap-3 pt-5 text-xs"
              style={{ borderTop: "0.5px solid var(--color-charcoal)" }}>
              <div style={{ color: "var(--color-smoke)", fontFamily: "var(--font-body)" }}>
                SKU <span style={{ color: "var(--color-mist)", marginLeft: "6px" }}>{product._id.slice(-8).toUpperCase()}</span>
              </div>
              <div style={{ color: "var(--color-smoke)", fontFamily: "var(--font-body)" }}>
                Status{" "}
                <span style={{ color: product.isPublished ? "#70a880" : "var(--color-smoke)", marginLeft: "6px" }}>
                  {product.isPublished ? "Available" : "Unavailable"}
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Reviews */}
        <ReviewsSection productId={id} productRating={product.rating} reviewsCount={product.reviewsCount ?? 0} />

      </div>
    </div>
  );
};

export default ProductDetails;