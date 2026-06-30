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

  const handleSearchChange = (e) => { setSearchTerm(e.target.value); setCurrentPage(1); };

  const { data, isLoading, error } = useQuery({
    queryKey:       ["products", currentPage, searchTerm],
    queryFn:        () => getProducts(currentPage, 10, searchTerm),
    placeholderData: keepPreviousData,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["products"] });

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess:  () => { invalidate(); setIsModalOpen(false); setSelectedProduct(null); },
    onError:    (err) => alert(`Error: ${err.response?.data?.message || err.message}`),
  });

  const updateMutation = useMutation({
    mutationFn: updateProduct,
    onSuccess:  () => { invalidate(); setIsModalOpen(false); setSelectedProduct(null); },
    onError:    (err) => alert(`Error: ${err.response?.data?.message || err.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess:  () => { invalidate(); setIsDeleteModalOpen(false); setProductToDelete(null); },
    onError:    (err) => alert(`Error: ${err.response?.data?.message || err.message}`),
  });

  const handleCreateProduct = (formData) => createMutation.mutate(formData);
  const handleUpdateProduct = (formData) => updateMutation.mutate({ id: selectedProduct._id, formData });
  const handleDeleteProduct = () => deleteMutation.mutate(productToDelete._id);

  // Backend returns: { success, data: [...], pagination: { total, page, limit, pages } }
  const products   = data?.data       ?? [];
  // ✅ FIX: backend returns `pages` not `totalPages`, and `total` not `totalItems`
  const pagination = data?.pagination ? {
    page:       data.pagination.page,
    totalPages: data.pagination.pages,
    totalItems: data.pagination.total,
  } : null;

  const getPrimaryImage = (product) => {
    if (!product.images?.length) return null;
    const primary = product.images.find((img) => img.isPrimary);
    return (primary ?? product.images[0])?.url ?? null;
  };

  // ✅ FIX: price and stock live in variants[] — show lowest price and total stock
  const getLowestPrice = (product) => {
    if (!product.variants?.length) return null;
    return Math.min(...product.variants.map((v) => v.price));
  };

  const getTotalStock = (product) => {
    if (!product.variants?.length) return 0;
    return product.variants.reduce((sum, v) => sum + v.stock, 0);
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Products</h1>
            <p className="text-gray-400 mt-1 text-sm">Manage your product catalog</p>
          </div>
          <button onClick={() => { setSelectedProduct(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-semibold text-sm shadow-sm w-fit">
            <PlusCircle size={17} /> Add Product
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
          <div className="relative max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" placeholder="Search products…" value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-8 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16">
              <AlertTriangle size={32} className="mb-2 text-red-300" />
              <p className="text-sm text-red-400">Error: {error.message}</p>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-300">
              <Package size={36} className="mb-2" />
              <p className="text-sm font-medium text-gray-400">No products found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {["Product", "Brand", "Gender", "Min Price", "Total Stock", "Rating", "Status", "Actions"].map((h) => (
                        <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {products.map((product) => {
                      const imgUrl     = getPrimaryImage(product);
                      const brandName  = product.brand?.name ?? "—";
                      // ✅ FIX: use variant-aware helpers
                      const minPrice   = getLowestPrice(product);
                      const totalStock = getTotalStock(product);
                      const isLowStock   = totalStock > 0 && totalStock < 10;
                      const isOutOfStock = totalStock === 0;

                      return (
                        <tr key={product._id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-100">
                                {imgUrl
                                  ? <img src={imgUrl} alt={product.name} className="w-full h-full object-cover" />
                                  : <div className="w-full h-full flex items-center justify-center"><Package size={14} className="text-gray-300" /></div>
                                }
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate max-w-[160px]">{product.name}</p>
                                <p className="text-xs text-gray-400 truncate max-w-[160px]">{product.concentration}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-700 font-medium">{brandName}</span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700">{product.gender}</span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="text-sm font-bold text-gray-900">
                              {minPrice !== null ? `$${minPrice.toFixed(2)}` : "—"}
                            </span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 text-sm font-semibold ${
                              isOutOfStock ? "text-red-600" : isLowStock ? "text-amber-600" : "text-gray-700"
                            }`}>
                              {(isOutOfStock || isLowStock) && <AlertTriangle size={13} />}
                              {totalStock}
                            </span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <Star size={13} className="text-amber-400 fill-amber-400" />
                              <span className="text-sm font-semibold text-gray-900">{product.rating?.toFixed(1) ?? "0.0"}</span>
                              <span className="text-xs text-gray-400">({product.reviewsCount ?? 0})</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                              product.isPublished ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
                            }`}>
                              {product.isPublished ? "Published" : "Draft"}
                            </span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => { setSelectedProduct(product); setIsModalOpen(true); }}
                                className="p-2 rounded-lg text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-colors" title="Edit">
                                <Edit2 size={15} />
                              </button>
                              <button onClick={() => { setProductToDelete(product); setIsDeleteModalOpen(true); }}
                                className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete">
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {pagination && (
                <div className="px-5 py-4 flex items-center justify-between border-t border-gray-50 bg-gray-50/50">
                  <p className="text-xs text-gray-400">
                    Page <span className="font-semibold text-gray-700">{pagination.page}</span> of{" "}
                    <span className="font-semibold text-gray-700">{pagination.totalPages}</span>
                    {" · "}<span className="font-semibold text-gray-700">{pagination.totalItems}</span> total
                  </p>
                  <div className="flex gap-1.5">
                    <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-xl border border-gray-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      <ChevronLeft size={16} className="text-gray-600" />
                    </button>
                    <button onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={currentPage === pagination.totalPages}
                      className="p-2 rounded-xl border border-gray-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      <ChevronRight size={16} className="text-gray-600" />
                    </button>
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
        onSubmit={selectedProduct ? handleUpdateProduct : handleCreateProduct}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setProductToDelete(null); }}
        onConfirm={handleDeleteProduct}
        productName={productToDelete?.name}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default ProductsAdmin;