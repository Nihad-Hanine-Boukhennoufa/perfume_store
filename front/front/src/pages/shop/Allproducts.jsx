import { useState, useEffect, useCallback } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  Search, SlidersHorizontal, X, ChevronDown,
  Package, AlertTriangle, ChevronLeft, ChevronRight,
} from "lucide-react";
import { getProducts } from "../../api/product.api";
import { getCart }     from "../../api/cart.api";
import { getWishlist } from "../../api/wishlist.api";
import ProductCard     from "../../components/product/ProductCard";

// ─── Constants ────────────────────────────────────────────────────────────────

const GENDERS        = ["Men", "Women", "Unisex"];
const CONCENTRATIONS = ["EDP", "EDT", "Perfume"];
const SCENT_TYPES    = ["Classic", "Floral", "Woody", "Fresh", "Oriental", "Citrus", "Aquatic", "Fruity", "Leather"];
const SEASONS        = ["Winter", "Summer", "All Seasons"];

const SORT_OPTIONS = [
  { value: "newest",      label: "Newest"         },
  { value: "oldest",      label: "Oldest"         },
  { value: "price_asc",   label: "Price: Low–High" },
  { value: "price_desc",  label: "Price: High–Low" },
  { value: "rating_desc", label: "Top Rated"       },
];

const EMPTY_FILTERS = {
  gender: "", concentration: "", season: "", scentType: "",
  minPrice: "", maxPrice: "", sort: "newest",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getPageWindow = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [];
  const addEllipsis = () => { if (pages[pages.length - 1] !== "...") pages.push("..."); };
  pages.push(1);
  if (current > 3) addEllipsis();
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p);
  if (current < total - 2) addEllipsis();
  pages.push(total);
  return pages;
};

const countActiveFilters = (f) =>
  Object.entries(f).filter(([k, v]) => k !== "sort" && v !== "").length;

// ─── Styled Select ────────────────────────────────────────────────────────────

function LuxSelect({ value, onChange, children, style = {} }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className="w-full appearance-none text-xs tracking-wide outline-none pr-7 py-2.5 px-3 transition-colors duration-200"
        style={{
          background:  "var(--color-charcoal)",
          border:      "0.5px solid var(--color-smoke)",
          color:       "var(--color-mist)",
          fontFamily:  "var(--font-body)",
          borderRadius: "0",
          cursor: "pointer",
          ...style,
        }}
        onFocus={(e)  => (e.currentTarget.style.borderColor = "var(--color-gold)")}
        onBlur={(e)   => (e.currentTarget.style.borderColor = "var(--color-smoke)")}
      >
        {children}
      </select>
      <ChevronDown
        size={11}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: "var(--color-smoke)" }}
      />
    </div>
  );
}

// ─── Filter Panel ─────────────────────────────────────────────────────────────

function FilterPanel({ filters, onChange, onReset, activeCount, isMobile, onClose }) {
  const set = (key, val) => onChange({ ...filters, [key]: val });

  const FilterSection = ({ label, field, options }) => (
    <div>
      <p
        className="text-[9px] tracking-[3px] uppercase mb-2"
        style={{ color: "var(--color-gold)", fontFamily: "var(--font-body)" }}
      >
        {label}
      </p>
      <LuxSelect value={filters[field]} onChange={(e) => set(field, e.target.value)}>
        <option value="">All</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </LuxSelect>
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Mobile header */}
      {isMobile && (
        <div
          className="flex items-center justify-between pb-4"
          style={{ borderBottom: "0.5px solid var(--color-charcoal)" }}
        >
          <span
            className="text-[9px] tracking-[4px] uppercase"
            style={{ color: "var(--color-gold)", fontFamily: "var(--font-body)" }}
          >
            Refine Selection
          </span>
          <button
            onClick={onClose}
            className="p-1.5 transition-colors duration-150"
            style={{ color: "var(--color-mist)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-pearl)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-mist)")}
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>
      )}

      {/* Price range */}
      <div>
        <p
          className="text-[9px] tracking-[3px] uppercase mb-2"
          style={{ color: "var(--color-gold)", fontFamily: "var(--font-body)" }}
        >
          Price Range
        </p>
        <div className="flex items-center gap-2">
          <input
            type="number" min="0" placeholder="Min"
            value={filters.minPrice}
            onChange={(e) => set("minPrice", e.target.value)}
            className="w-full text-xs outline-none py-2.5 px-3 transition-colors duration-200"
            style={{
              background:  "var(--color-charcoal)",
              border:      "0.5px solid var(--color-smoke)",
              color:       "var(--color-mist)",
              fontFamily:  "var(--font-body)",
              borderRadius: "0",
            }}
            onFocus={(e)  => (e.currentTarget.style.borderColor = "var(--color-gold)")}
            onBlur={(e)   => (e.currentTarget.style.borderColor = "var(--color-smoke)")}
          />
          <span style={{ color: "var(--color-smoke)", fontSize: "10px" }}>—</span>
          <input
            type="number" min="0" placeholder="Max"
            value={filters.maxPrice}
            onChange={(e) => set("maxPrice", e.target.value)}
            className="w-full text-xs outline-none py-2.5 px-3 transition-colors duration-200"
            style={{
              background:  "var(--color-charcoal)",
              border:      "0.5px solid var(--color-smoke)",
              color:       "var(--color-mist)",
              fontFamily:  "var(--font-body)",
              borderRadius: "0",
            }}
            onFocus={(e)  => (e.currentTarget.style.borderColor = "var(--color-gold)")}
            onBlur={(e)   => (e.currentTarget.style.borderColor = "var(--color-smoke)")}
          />
        </div>
      </div>

      <FilterSection label="Gender"        field="gender"        options={GENDERS}        />
      <FilterSection label="Concentration" field="concentration" options={CONCENTRATIONS} />
      <FilterSection label="Season"        field="season"        options={SEASONS}        />
      <FilterSection label="Scent Family"  field="scentType"     options={SCENT_TYPES}    />

      {/* Clear filters */}
      {activeCount > 0 && (
        <button
          onClick={onReset}
          className="flex items-center justify-center gap-2 w-full py-2.5 text-[10px] tracking-[2px] uppercase transition-all duration-200"
          style={{
            border:      "0.5px solid var(--color-smoke)",
            color:       "var(--color-mist)",
            fontFamily:  "var(--font-body)",
            background:  "transparent",
            borderRadius: "0",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--color-gold)";
            e.currentTarget.style.color       = "var(--color-gold)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--color-smoke)";
            e.currentTarget.style.color       = "var(--color-mist)";
          }}
        >
          <X size={11} strokeWidth={1.5} />
          Clear {activeCount} filter{activeCount > 1 ? "s" : ""}
        </button>
      )}
    </div>
  );
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div
      className="overflow-hidden animate-pulse"
      style={{
        background:   "var(--color-ink)",
        border:       "0.5px solid var(--color-charcoal)",
        borderRadius: "0",
      }}
    >
      <div
        className="aspect-square"
        style={{ background: "var(--color-charcoal)" }}
      />
      <div className="p-4 space-y-3">
        <div className="h-2 w-16 rounded-sm" style={{ background: "var(--color-charcoal)" }} />
        <div className="h-4 w-3/4 rounded-sm" style={{ background: "var(--color-charcoal)" }} />
        <div className="h-2 w-1/2 rounded-sm" style={{ background: "var(--color-charcoal)" }} />
        <div className="h-8 w-full rounded-sm" style={{ background: "var(--color-charcoal)" }} />
      </div>
    </div>
  );
}

// ─── Active Filter Chip ───────────────────────────────────────────────────────

function FilterChip({ label, onRemove }) {
  return (
    <button
      onClick={onRemove}
      className="flex items-center gap-1.5 px-3 py-1 text-[9px] tracking-[2px] uppercase transition-all duration-200 group"
      style={{
        border:      "0.5px solid var(--color-gold-dark)",
        color:       "var(--color-gold)",
        background:  "rgba(201,168,76,0.07)",
        fontFamily:  "var(--font-body)",
        borderRadius: "0",
      }}
    >
      {label}
      <X size={9} strokeWidth={2} />
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const AllProducts = () => {
  const [page,           setPage]       = useState(1);
  const [search,         setSearch]     = useState("");
  const [debouncedSearch,setDebounced]  = useState("");
  const [filters,        setFilters]    = useState(EMPTY_FILTERS);
  const [drawerOpen,     setDrawerOpen] = useState(false);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const handleFilterChange = useCallback((f) => { setFilters(f); setPage(1); }, []);
  const handleReset = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    setSearch("");
    setDebounced("");
    setPage(1);
  }, []);

  const activeFilterCount = countActiveFilters(filters);

  // Products
  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ["products", page, debouncedSearch, filters],
    queryFn:  () => getProducts(page, 12, debouncedSearch, {
      gender:        filters.gender        || undefined,
      concentration: filters.concentration || undefined,
      season:        filters.season        || undefined,
      scentType:     filters.scentType     || undefined,
      minPrice:      filters.minPrice      || undefined,
      maxPrice:      filters.maxPrice      || undefined,
      sort:          filters.sort,
    }),
    placeholderData: keepPreviousData,
  });

  // Cart + Wishlist fetched once
  const { data: cart }     = useQuery({ queryKey: ["cart"],     queryFn: getCart     });
  const { data: wishlist } = useQuery({ queryKey: ["wishlist"], queryFn: getWishlist });

  const cartIds     = new Set(cart?.items?.map((i) => i.productId?._id ?? i.productId) ?? []);
  const wishlistIds = new Set(wishlist?.map((i) => i.productId?._id ?? i.productId)    ?? []);

  const products   = data?.data             ?? [];
  const pagination = data?.pagination       ?? null;
  const totalPages = pagination?.totalPages ?? 1;
  const totalItems = pagination?.totalItems ?? 0;
  const pageWindow = getPageWindow(page, totalPages);

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--color-obsidian)" }}
    >

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div
        className="py-14 text-center"
        style={{ borderBottom: "0.5px solid var(--color-charcoal)" }}
      >
        <p
          className="text-[9px] tracking-[5px] uppercase mb-3"
          style={{ color: "var(--color-gold)", fontFamily: "var(--font-body)" }}
        >
          Our Selection
        </p>
        <h1
          className="text-5xl font-light"
          style={{
            fontFamily:    "var(--font-display)",
            color:         "var(--color-pearl)",
            letterSpacing: "2px",
          }}
        >
          Collections
        </h1>
        <div
          className="w-10 mx-auto mt-5"
          style={{ height: "0.5px", background: "var(--color-gold)" }}
        />
      </div>

      {/* ── Toolbar ──────────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-20"
        style={{
          background: "rgba(13,13,13,0.97)",
          borderBottom: "0.5px solid var(--color-charcoal)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-14 flex items-center gap-4">

          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search
              size={13}
              strokeWidth={1.5}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "var(--color-smoke)" }}
            />
            <input
              type="text"
              placeholder="Search fragrances..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs tracking-wide outline-none transition-colors duration-200"
              style={{
                background:   "var(--color-charcoal)",
                border:       "0.5px solid var(--color-smoke)",
                color:        "var(--color-pearl)",
                fontFamily:   "var(--font-body)",
                borderRadius: "0",
              }}
              onFocus={(e)  => (e.currentTarget.style.borderColor = "var(--color-gold)")}
              onBlur={(e)   => (e.currentTarget.style.borderColor = "var(--color-smoke)")}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors duration-150"
                style={{ color: "var(--color-smoke)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-gold)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-smoke)")}
              >
                <X size={12} strokeWidth={1.5} />
              </button>
            )}
          </div>

          {/* Spacer */}
          <div className="flex-1 hidden sm:block" />

          {/* Result count */}
          {!isLoading && (
            <span
              className="hidden sm:block text-[10px] tracking-[1px]"
              style={{ color: "var(--color-smoke)", fontFamily: "var(--font-body)" }}
            >
              {totalItems} items
            </span>
          )}

          {/* Separator */}
          <span
            className="hidden sm:block w-px h-4 flex-shrink-0"
            style={{ background: "var(--color-charcoal)" }}
          />

          {/* Sort — desktop */}
          <div className="hidden sm:block w-44">
            <LuxSelect
              value={filters.sort}
              onChange={(e) => handleFilterChange({ ...filters, sort: e.target.value })}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </LuxSelect>
          </div>

          {/* Mobile filter button */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="lg:hidden flex items-center gap-2 px-4 py-2 text-[10px] tracking-[2px] uppercase transition-all duration-200"
            style={{
              border:      "0.5px solid var(--color-smoke)",
              color:       "var(--color-mist)",
              fontFamily:  "var(--font-body)",
              background:  "transparent",
              borderRadius: "0",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--color-gold)";
              e.currentTarget.style.color       = "var(--color-gold)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--color-smoke)";
              e.currentTarget.style.color       = "var(--color-mist)";
            }}
          >
            <SlidersHorizontal size={13} strokeWidth={1.5} />
            Filters
            {activeFilterCount > 0 && (
              <span
                className="w-4 h-4 flex items-center justify-center text-[9px] font-medium"
                style={{
                  background:  "var(--color-gold)",
                  color:       "var(--color-obsidian)",
                  borderRadius: "50%",
                }}
              >
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8 flex gap-8">

        {/* ── Desktop Sidebar ──────────────────────────────────────── */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <div
            className="sticky top-[57px] p-5"
            style={{
              background:   "var(--color-ink)",
              border:       "0.5px solid var(--color-charcoal)",
              borderRadius: "0",
            }}
          >
            {/* Sidebar header */}
            <div
              className="flex items-center justify-between mb-6"
              style={{ borderBottom: "0.5px solid var(--color-charcoal)", paddingBottom: "12px" }}
            >
              <span
                className="text-[9px] tracking-[4px] uppercase"
                style={{ color: "var(--color-gold)", fontFamily: "var(--font-body)" }}
              >
                Refine
              </span>
              {activeFilterCount > 0 && (
                <span
                  className="text-[9px] px-2 py-0.5"
                  style={{
                    background:  "rgba(201,168,76,0.12)",
                    color:       "var(--color-gold)",
                    border:      "0.5px solid var(--color-gold-dark)",
                    fontFamily:  "var(--font-body)",
                  }}
                >
                  {activeFilterCount} active
                </span>
              )}
            </div>

            <FilterPanel
              filters={filters}
              onChange={handleFilterChange}
              onReset={handleReset}
              activeCount={activeFilterCount}
            />
          </div>
        </aside>

        {/* ── Product Area ─────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* Active filter chips */}
          {(activeFilterCount > 0 || debouncedSearch) && (
            <div className="flex flex-wrap gap-2 mb-6">
              {Object.entries(filters).map(([key, value]) => {
                if (!value || key === "sort") return null;
                return (
                  <FilterChip
                    key={key}
                    label={value}
                    onRemove={() => handleFilterChange({ ...filters, [key]: "" })}
                  />
                );
              })}
              {debouncedSearch && (
                <FilterChip
                  label={`"${debouncedSearch}"`}
                  onRemove={() => { setSearch(""); setDebounced(""); }}
                />
              )}
              <button
                onClick={handleReset}
                className="text-[9px] tracking-[2px] uppercase transition-colors duration-150 px-2"
                style={{ color: "var(--color-smoke)", fontFamily: "var(--font-body)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-mist)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-smoke)")}
              >
                Clear all
              </button>
            </div>
          )}

          {/* ── States ──────────────────────────────────────────────── */}

          {/* Error */}
          {isError && (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <AlertTriangle
                size={32}
                strokeWidth={1}
                style={{ color: "var(--color-smoke)", marginBottom: "12px" }}
              />
              <p
                className="text-sm"
                style={{ color: "var(--color-mist)", fontFamily: "var(--font-body)" }}
              >
                Failed to load products
              </p>
            </div>
          )}

          {/* Loading skeleton */}
          {isLoading && !isError && (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !isError && products.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <Package
                size={36}
                strokeWidth={1}
                style={{ color: "var(--color-charcoal)", marginBottom: "16px" }}
              />
              <p
                className="text-sm mb-1"
                style={{
                  color:      "var(--color-mist)",
                  fontFamily: "var(--font-display)",
                  fontSize:   "20px",
                  fontWeight: "300",
                }}
              >
                No fragrances found
              </p>
              <p
                className="text-xs mb-6"
                style={{ color: "var(--color-smoke)", fontFamily: "var(--font-body)" }}
              >
                Try adjusting your filters or search term
              </p>
              {(activeFilterCount > 0 || debouncedSearch) && (
                <button
                  onClick={handleReset}
                  className="px-6 py-2.5 text-[10px] tracking-[3px] uppercase transition-all duration-200"
                  style={{
                    background:  "var(--color-gold)",
                    color:       "var(--color-obsidian)",
                    fontFamily:  "var(--font-body)",
                    borderRadius: "0",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-gold-light)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "var(--color-gold)")}
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}

          {/* Product grid */}
          {!isLoading && !isError && products.length > 0 && (
            <div
              className={`
                grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3
                transition-opacity duration-150
                ${isFetching ? "opacity-50" : "opacity-100"}
              `}
            >
              {products.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  inCart={cartIds.has(product._id)}
                  inWishlist={wishlistIds.has(product._id)}
                />
              ))}
            </div>
          )}

          {/* ── Pagination ──────────────────────────────────────────── */}
          {!isLoading && !isError && totalPages > 1 && (
            <div className="flex justify-center items-center gap-1.5 mt-12 flex-wrap">
              {/* Prev */}
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="flex items-center gap-1.5 px-4 py-2 text-[10px] tracking-[2px] uppercase transition-all duration-200 disabled:opacity-30"
                style={{
                  border:      "0.5px solid var(--color-charcoal)",
                  color:       "var(--color-mist)",
                  fontFamily:  "var(--font-body)",
                  background:  "transparent",
                  borderRadius: "0",
                }}
                onMouseEnter={(e) => {
                  if (page !== 1) {
                    e.currentTarget.style.borderColor = "var(--color-gold)";
                    e.currentTarget.style.color       = "var(--color-gold)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-charcoal)";
                  e.currentTarget.style.color       = "var(--color-mist)";
                }}
              >
                <ChevronLeft size={12} strokeWidth={1.5} />
                Prev
              </button>

              {/* Pages */}
              {pageWindow.map((p, i) =>
                p === "..." ? (
                  <span
                    key={`e-${i}`}
                    className="px-2 py-2 text-xs select-none"
                    style={{ color: "var(--color-smoke)" }}
                  >
                    ···
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className="w-9 h-9 flex items-center justify-center text-xs tracking-wide transition-all duration-200"
                    style={
                      p === page
                        ? {
                            background:   "var(--color-gold)",
                            color:        "var(--color-obsidian)",
                            border:       "0.5px solid var(--color-gold)",
                            fontFamily:   "var(--font-body)",
                            borderRadius: "0",
                            fontWeight:   "500",
                          }
                        : {
                            background:   "transparent",
                            color:        "var(--color-mist)",
                            border:       "0.5px solid var(--color-charcoal)",
                            fontFamily:   "var(--font-body)",
                            borderRadius: "0",
                          }
                    }
                    onMouseEnter={(e) => {
                      if (p !== page) {
                        e.currentTarget.style.borderColor = "var(--color-gold)";
                        e.currentTarget.style.color       = "var(--color-gold)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (p !== page) {
                        e.currentTarget.style.borderColor = "var(--color-charcoal)";
                        e.currentTarget.style.color       = "var(--color-mist)";
                      }
                    }}
                  >
                    {p}
                  </button>
                )
              )}

              {/* Next */}
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="flex items-center gap-1.5 px-4 py-2 text-[10px] tracking-[2px] uppercase transition-all duration-200 disabled:opacity-30"
                style={{
                  border:      "0.5px solid var(--color-charcoal)",
                  color:       "var(--color-mist)",
                  fontFamily:  "var(--font-body)",
                  background:  "transparent",
                  borderRadius: "0",
                }}
                onMouseEnter={(e) => {
                  if (page !== totalPages) {
                    e.currentTarget.style.borderColor = "var(--color-gold)";
                    e.currentTarget.style.color       = "var(--color-gold)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-charcoal)";
                  e.currentTarget.style.color       = "var(--color-mist)";
                }}
              >
                Next
                <ChevronRight size={12} strokeWidth={1.5} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile Filter Drawer ─────────────────────────────────────── */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30 lg:hidden"
            style={{ background: "rgba(0,0,0,0.7)" }}
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer */}
          <div
            className="fixed bottom-0 left-0 right-0 z-40 lg:hidden max-h-[85vh] overflow-y-auto"
            style={{
              background:                 "var(--color-ink)",
              borderTop:                  "0.5px solid var(--color-charcoal)",
              borderTopLeftRadius:        "0",
              borderTopRightRadius:       "0",
              boxShadow:                  "0 -20px 60px rgba(0,0,0,0.8)",
            }}
          >
            {/* Sort section */}
            <div
              className="px-5 pt-5 pb-4"
              style={{ borderBottom: "0.5px solid var(--color-charcoal)" }}
            >
              <p
                className="text-[9px] tracking-[3px] uppercase mb-3"
                style={{ color: "var(--color-gold)", fontFamily: "var(--font-body)" }}
              >
                Sort By
              </p>
              <LuxSelect
                value={filters.sort}
                onChange={(e) => handleFilterChange({ ...filters, sort: e.target.value })}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </LuxSelect>
            </div>

            {/* Filters */}
            <div className="p-5">
              <FilterPanel
                filters={filters}
                onChange={handleFilterChange}
                onReset={handleReset}
                activeCount={activeFilterCount}
                isMobile
                onClose={() => setDrawerOpen(false)}
              />
            </div>

            {/* Apply button */}
            <div
              className="px-5 pb-8 pt-2"
              style={{ borderTop: "0.5px solid var(--color-charcoal)" }}
            >
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-full py-3.5 text-[10px] tracking-[3px] uppercase transition-all duration-200"
                style={{
                  background:  "var(--color-gold)",
                  color:       "var(--color-obsidian)",
                  fontFamily:  "var(--font-body)",
                  borderRadius: "0",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-gold-light)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--color-gold)")}
              >
                View {totalItems} result{totalItems !== 1 ? "s" : ""}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AllProducts;