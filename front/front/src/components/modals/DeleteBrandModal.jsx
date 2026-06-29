import { Trash2, Loader2 } from "lucide-react";

function DeleteBrandModal({ isOpen, onClose, onConfirm, brand, isLoading }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <Trash2 size={18} className="text-red-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Delete Brand</h3>
            <p className="text-xs text-gray-400">This action cannot be undone</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3.5 mb-6">
          {brand?.image && (
            <img
              src={brand.image}
              alt={brand.name}
              className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-gray-100"
            />
          )}
          <p className="text-sm text-gray-700">
            Permanently delete{" "}
            <span className="font-bold text-gray-900">{brand?.name}</span> and its
            logo from Cloudinary?
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold text-sm disabled:opacity-50"
          >
            {isLoading && <Loader2 size={15} className="animate-spin" />}
            {isLoading ? "Deleting…" : "Delete Brand"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteBrandModal;