import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  PlusCircle, Edit2, Trash2, Search,
  ChevronLeft, ChevronRight, Package, Star, AlertTriangle,
} from "lucide-react";
import { getProducts, createProduct, updateProduct, deleteProduct } from "../../api/product.api.js";
import ProductModal from "../../components/modals/ProductModal.jsx";
import DeleteModal   from "../../components/modals/DeleteModal.jsx";

const ProductsAdmin = () => {
  const [currentPage,       setCurrentPage]       = useState(1);
  const [searchTerm,        setSearchTerm]        = useState("");
  const [isModalOpen,       setIsModalOpen]       = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProduct,   setSelectedProduct]   = useState(null);
  const [productToDelete,   setProductToDelete]   = useState(null);

  const queryClient = useQueryClient();
  const invalidate  = () => queryClient.invalidateQueries({ queryKey: ["products"] });

  const handleSearchChange = (e) => { setSearchTerm(e.target.value); setCurrentPage(1); };

  const { data, isLoading, error } = useQuery({
    queryKey:        ["products", currentPage, searchTerm],
    queryFn:         () => getProducts(currentPage, 10, searchTerm),
    placeholderData: keepPreviousData,
  });

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess:  () => { invalidate(); setIsModalOpen(false); setSelectedProduct(null); },
    onError:    (err) => alert(err.response?.data?.message || err.message),
  });

  const updateMutation = useMutation({
    mutationFn: updateProduct,
    onSuccess:  () => { invalidate(); setIsModalOpen(false); setSelectedProduct(null); },
    onError:    (err) => alert(err.response?.data?.message || err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess:  () => { invalidate(); setIsDeleteModalOpen(false); setProductToDelete(null); },
    onError:    (err) => alert(err.response?.data?.message || err.message),
  });

  const products = data?.data ?? [];
  const pagination = data?.pagination ? {
    page:       data.pagination.page,
    totalPages: data.pagination.pages,
    totalItems: data.pagination.total,
  } : null;

  const getPrimaryImage = (p) => {
    if (!p.images?.length) return null;
    return (p.images.find((i) => i.isPrimary) ?? p.images[0])?.url ?? null;
  };
  const getLowestPrice = (p) =>
    p.variants?.length ? Math.min(...p.variants.map((v) => v.price)) : null;
  const getTotalStock = (p) =>
    p.variants?.reduce((s, v) => s + v.stock, 0) ?? 0;

  const inputStyle = {
    background: "var(--color-charcoal)", border: "0.5px solid var(--color-smoke)",
    color: "var(--color-pearl)", fontFamily: "var(--font-body)", borderRadius: 0,
  };

  return (
    <div className="p-6 lg:p-8" style={{ background: "var(--color-obsidian)", minHeight: "100vh" }}>
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <p className="text-[9px] tracking-[5px] uppercase mb-1"
              style={{ color: "var(--color-gold)", fontFamily: "var(--font-body)" }}>Admin</p>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "36px", fontWeight: 400, color: "var(--color-pearl)" }}>
              Products
            </h1>
          </div>
          <button onClick={() => { setSelectedProduct(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-5 py-3 text-[10px] tracking-[2px] uppercase w-fit transition-all duration-200"
            style={{ background: "var(--color-gold)", color: "var(--color-obsidian)", fontFamily: "var(--font-body)", border: "none", borderRadius: 0, cursor: "pointer" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-gold-light)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--color-gold)")}
          ><PlusCircle size={14} strokeWidth={1.5} /> Add Product</button>
        </div>

        {/* Search */}
        <div className="p-4 mb-5" style={{ background: "var(--color-ink)", border: "0.5px solid var(--color-charcoal)" }}>
          <div className="relative max-w-sm">
            <Search size={14} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--color-smoke)" }} />
            <input type="text" placeholder="Search products…" value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-4 py-2.5 text-xs outline-none"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-gold)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-smoke)")}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ background: "var(--color-ink)", border: "0.5px solid var(--color-charcoal)" }}>
          {isLoading ? (
            <div className="p-6 flex flex-col gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse" style={{ background: "var(--color-charcoal)" }} />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center py-16">
              <AlertTriangle size={28} strokeWidth={1} style={{ color: "#c08080", marginBottom: 12 }} />
              <p className="text-sm" style={{ color: "#c08080", fontFamily: "var(--font-body)" }}>Error: {error.message}</p>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center py-16">
              <Package size={32} strokeWidth={1} style={{ color: "var(--color-charcoal)", marginBottom: 16 }} />
              <p style={{ fontFamily: "var(--font-display)", fontSize: "20px", color: "var(--color-mist)" }}>No products found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: "0.5px solid var(--color-charcoal)" }}>
                      {["Product", "Brand", "Gender", "Min Price", "Stock", "Rating", "Status", ""].map((h) => (
                        <th key={h} className="px-5 py-3 text-left text-[9px] tracking-[2px] uppercase"
                          style={{ color: "var(--color-mist)", fontFamily: "var(--font-body)", background: "var(--color-obsidian)" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => {
                      const imgUrl     = getPrimaryImage(product);
                      const minPrice   = getLowestPrice(product);
                      const totalStock = getTotalStock(product);
                      const isLow      = totalStock > 0 && totalStock < 10;
                      const isOut      = totalStock === 0;

                      return (
                        <tr key={product._id} className="transition-colors duration-150"
                          style={{ borderBottom: "0.5px solid var(--color-charcoal)" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="shrink-0 overflow-hidden"
                                style={{ width: 40, height: 40, background: "var(--color-charcoal)", border: "0.5px solid var(--color-smoke)" }}>
                                {imgUrl
                                  ? <img src={imgUrl} alt={product.name} className="w-full h-full object-cover" />
                                  : <div className="w-full h-full flex items-center justify-center">
                                      <Package size={14} strokeWidth={1} style={{ color: "var(--color-smoke)" }} />
                                    </div>
                                }
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate max-w-37.5"
                                  style={{ color: "var(--color-pearl)", fontFamily: "var(--font-body)" }}>{product.name}</p>
                                <p className="text-[10px] truncate max-w-37.5"
                                  style={{ color: "var(--color-smoke)", fontFamily: "var(--font-body)" }}>{product.concentration}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="text-xs" style={{ color: "var(--color-mist)", fontFamily: "var(--font-body)" }}>
                              {product.brand?.name ?? "—"}
                            </span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="px-2.5 py-1 text-[9px] tracking-[1px] uppercase"
                              style={{ color: "var(--color-gold)", background: "rgba(201,168,76,0.1)", border: "0.5px solid rgba(201,168,76,0.2)", fontFamily: "var(--font-body)" }}>
                              {product.gender}
                            </span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span style={{ fontFamily: "var(--font-display)", fontSize: "15px", color: "var(--color-pearl)" }}>
                              {minPrice !== null ? `$${minPrice.toFixed(2)}` : "—"}
                            </span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="flex items-center gap-1 text-xs"
                              style={{
                                color: isOut ? "#c08080" : isLow ? "var(--color-gold)" : "var(--color-mist)",
                                fontFamily: "var(--font-body)",
                              }}>
                              {(isOut || isLow) && <AlertTriangle size={11} strokeWidth={1.5} />}
                              {totalStock}
                            </span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <Star size={11} strokeWidth={1} style={{ color: "var(--color-gold)", fill: "var(--color-gold)" }} />
                              <span className="text-xs" style={{ color: "var(--color-pearl)", fontFamily: "var(--font-body)" }}>
                                {product.rating?.toFixed(1) ?? "0.0"}
                              </span>
                              <span className="text-[10px]" style={{ color: "var(--color-smoke)", fontFamily: "var(--font-body)" }}>
                                ({product.reviewsCount ?? 0})
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="px-2.5 py-1 text-[9px] tracking-[1px] uppercase"
                              style={{
                                color:      product.isPublished ? "#70a880" : "var(--color-smoke)",
                                background: product.isPublished ? "rgba(30,80,50,0.15)" : "rgba(255,255,255,0.04)",
                                border:     `0.5px solid ${product.isPublished ? "rgba(60,120,80,0.25)" : "var(--color-charcoal)"}`,
                                fontFamily: "var(--font-body)",
                              }}>
                              {product.isPublished ? "Published" : "Draft"}
                            </span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button onClick={() => { setSelectedProduct(product); setIsModalOpen(true); }}
                                className="p-1.5 transition-colors duration-150"
                                style={{ color: "var(--color-smoke)", background: "none", border: "none", cursor: "pointer" }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-gold)")}
                                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-smoke)")}
                              ><Edit2 size={14} strokeWidth={1.5} /></button>
                              <button onClick={() => { setProductToDelete(product); setIsDeleteModalOpen(true); }}
                                className="p-1.5 transition-colors duration-150"
                                style={{ color: "var(--color-smoke)", background: "none", border: "none", cursor: "pointer" }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = "#c08080")}
                                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-smoke)")}
                              ><Trash2 size={14} strokeWidth={1.5} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && (
                <div className="flex items-center justify-between px-5 py-4"
                  style={{ borderTop: "0.5px solid var(--color-charcoal)" }}>
                  <p className="text-[10px]" style={{ color: "var(--color-smoke)", fontFamily: "var(--font-body)" }}>
                    Page <span style={{ color: "var(--color-pearl)" }}>{pagination.page}</span> of{" "}
                    <span style={{ color: "var(--color-pearl)" }}>{pagination.totalPages}</span>
                    {" · "}<span style={{ color: "var(--color-pearl)" }}>{pagination.totalItems}</span> total
                  </p>
                  <div className="flex gap-2">
                    {[
                      { icon: ChevronLeft,  action: () => setCurrentPage((p) => Math.max(1, p - 1)),                       disabled: currentPage === 1 },
                      { icon: ChevronRight, action: () => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1)),    disabled: currentPage === pagination.totalPages },
                    ].map(({ icon: Icon, action, disabled }, i) => (
                      <button key={i} onClick={action} disabled={disabled}
                        className="p-2 transition-all duration-150 disabled:opacity-30"
                        style={{ background: "var(--color-charcoal)", border: "0.5px solid var(--color-smoke)", color: "var(--color-mist)", borderRadius: 0, cursor: disabled ? "not-allowed" : "pointer" }}
                        onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.borderColor = "var(--color-gold)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-smoke)"; }}
                      ><Icon size={14} strokeWidth={1.5} /></button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ProductModal
        key={selectedProduct?._id || "new"}
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedProduct(null); }}
        product={selectedProduct}
        onSubmit={selectedProduct
          ? (fd) => updateMutation.mutate({ id: selectedProduct._id, formData: fd })
          : (fd) => createMutation.mutate(fd)
        }
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setProductToDelete(null); }}
        onConfirm={() => deleteMutation.mutate(productToDelete._id)}
        itemName={productToDelete?.name}
        itemType="product"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default ProductsAdmin;