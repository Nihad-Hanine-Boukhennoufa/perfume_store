import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  PlusCircle,
  Edit2,
  Trash2,
  Search,
  Tag,
  AlertTriangle,
} from "lucide-react";
import { getAllBrands, createBrand, updateBrand, deleteBrand } from "../../api/brand.api.js";
import BrandModal from "../../components/modals/BrandModal.jsx";
import DeleteBrandModal from "../../components/modals/DeleteBrandModal.jsx";

// ─── Main ─────────────────────────────────────────────────────────────────────

const BrandsAdmin = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [brandToDelete, setBrandToDelete] = useState(null);

  const queryClient = useQueryClient();

  const { data: brands = [], isLoading, error } = useQuery({
    queryKey: ["brands"],
    queryFn: getAllBrands,
  });

  const createMutation = useMutation({
    mutationFn: createBrand,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      setIsModalOpen(false);
    },
    onError: (err) => alert(`Error: ${err.response?.data?.message || err.message}`),
  });

  const updateMutation = useMutation({
    mutationFn: updateBrand,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      setIsModalOpen(false);
      setSelectedBrand(null);
    },
    onError: (err) => alert(`Error: ${err.response?.data?.message || err.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBrand,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      setIsDeleteModalOpen(false);
      setBrandToDelete(null);
    },
    onError: (err) => alert(`Error: ${err.response?.data?.message || err.message}`),
  });

  const handleSubmit = (formData) => {
    if (selectedBrand) {
      updateMutation.mutate({ id: selectedBrand._id, formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDeleteConfirm = () => {
    if (!brandToDelete) return;
    deleteMutation.mutate(brandToDelete._id);
  };

  const filteredBrands = brands.filter((b) =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">

        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Brands</h1>
            <p className="text-gray-400 mt-1 text-sm">Manage perfume brands and logos</p>
          </div>
          <button
            onClick={() => { setSelectedBrand(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-semibold text-sm shadow-sm w-fit"
          >
            <PlusCircle size={17} />
            Add Brand
          </button>
        </div>

        {/* ── Search + Count ────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
          <div className="flex items-center justify-between gap-4">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search brands…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400 flex-shrink-0">
              <Tag size={14} />
              <span>
                <span className="font-bold text-gray-900">{filteredBrands.length}</span> brands
              </span>
            </div>
          </div>
        </div>

        {/* ── Content ───────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 mb-4" />
                <div className="h-4 w-24 bg-gray-100 rounded mb-2" />
                <div className="h-3 w-16 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 flex flex-col items-center text-center">
            <AlertTriangle size={32} className="text-red-300 mb-2" />
            <p className="text-sm text-red-400">Error loading brands: {error.message}</p>
          </div>
        ) : filteredBrands.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 flex flex-col items-center text-center text-gray-300">
            <Tag size={36} className="mb-2" />
            <p className="text-sm font-medium text-gray-400">
              {searchTerm ? `No brands matching "${searchTerm}"` : "No brands yet"}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors"
              >
                Add your first brand
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredBrands.map((brand) => (
              <div
                key={brand._id}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                {/* Logo */}
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 mb-4 flex-shrink-0">
                  {brand.image ? (
                    <img src={brand.image} alt={brand.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Tag size={20} className="text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <h3 className="text-sm font-bold text-gray-900 truncate mb-1">{brand.name}</h3>
                <p className="text-xs text-gray-400">
                  Added{" "}
                  {new Date(brand.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-50">
                  <button
                    onClick={() => { setSelectedBrand(brand); setIsModalOpen(true); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <Edit2 size={13} />
                    Edit
                  </button>
                  <div className="w-px h-4 bg-gray-100" />
                  <button
                    onClick={() => { setBrandToDelete(brand); setIsDeleteModalOpen(true); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modals ────────────────────────────────────────────────────── */}
      <BrandModal
        key={selectedBrand?._id ?? "new"}
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedBrand(null); }}
        brand={selectedBrand}
        onSubmit={handleSubmit}
        isLoading={isMutating}
      />

      <DeleteBrandModal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setBrandToDelete(null); }}
        onConfirm={handleDeleteConfirm}
        brand={brandToDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default BrandsAdmin;