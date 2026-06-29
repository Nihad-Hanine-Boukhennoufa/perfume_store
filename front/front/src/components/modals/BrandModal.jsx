import { useState, useEffect } from "react";
import { X, Upload, Loader2 } from "lucide-react";

function BrandModal({ isOpen, onClose, brand, onSubmit, isLoading }) {
  const [name, setName] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  // Reset all fields whenever the modal opens or the target brand changes.
  // This is more reliable than depending on the key prop, which only remounts
  // when the key value actually changes — it stays "new" between successive
  // new-brand opens, so React skips the remount and old state leaks through.
  useEffect(() => {
    if (!isOpen) return;
    setName(brand?.name ?? "");
    setImageFile(null);
    setPreview(brand?.image ?? null);
    setDragOver(false);
  }, [isOpen, brand]);

  if (!isOpen) return null;

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    if (preview && !brand?.image) URL.revokeObjectURL(preview);
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = () => {
    if (!name.trim()) return alert("Brand name is required");
    if (!brand && !imageFile) return alert("Brand image is required");
    const fd = new FormData();
    fd.append("name", name.trim());
    if (imageFile) fd.append("image", imageFile);
    onSubmit(fd);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              {brand ? "Edit Brand" : "Add Brand"}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {brand ? "Update brand name or image" : "Create a new perfume brand"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Brand Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Chanel, Dior, Tom Ford"
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors"
            />
          </div>

          {/* Image upload */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Brand Logo {!brand && <span className="text-red-400">*</span>}
            </label>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-2xl transition-colors cursor-pointer ${
                dragOver
                  ? "border-blue-400 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300 bg-gray-50"
              }`}
            >
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFile(e.target.files[0])}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              {preview ? (
                <div className="flex items-center gap-4 p-4">
                  <img
                    src={preview}
                    alt="preview"
                    className="w-16 h-16 object-cover rounded-xl border border-gray-100 flex-shrink-0"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-700">
                      {imageFile ? imageFile.name : "Current image"}
                    </p>
                    <p className="text-xs text-blue-500 mt-0.5">Click or drag to replace</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                  <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center mb-2">
                    <Upload size={18} className="text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-600">
                    Drop image here or <span className="text-blue-500">browse</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP up to 5MB</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading && <Loader2 size={15} className="animate-spin" />}
            {isLoading ? "Saving…" : brand ? "Save Changes" : "Create Brand"}
          </button>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default BrandModal;