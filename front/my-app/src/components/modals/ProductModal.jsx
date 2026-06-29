import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  X,
  Upload,
  Plus,
  Trash2,
  Loader2,
  ImageIcon,
  ChevronDown,
} from "lucide-react";
import instance from "../../api/axios.js";

// ─── Constants (mirror your schema enums exactly) ─────────────────────────────

const GENDERS        = ["Men", "Women", "Unisex"];
const CONCENTRATIONS = ["EDP", "EDT", "Perfume"];
const SCENT_TYPES    = ["Classic", "Floral", "Woody", "Fresh", "Oriental", "Citrus", "Aquatic", "Fruity", "Leather","Sweet", "Powdery","Spicy","Aromatic"];
const SEASONS        = ["Winter", "Summer","Spring", "All Seasons"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fetchBrands = async () => {
  const { data } = await instance.get("/brands");
  return data.data;
};

// Stable ID generator for note rows — avoids index-as-key issues
let _noteIdCounter = 0;
const nextNoteId = () => `note_${++_noteIdCounter}`;

const Label = ({ children, required }) => (
  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
    {children}{required && <span className="text-red-400 ml-0.5">*</span>}
  </label>
);

const Input = ({ className = "", ...props }) => (
  <input
    {...props}
    className={`w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${className}`}
  />
);

const Select = ({ children, className = "", ...props }) => (
  <div className="relative">
    <select
      {...props}
      className={`w-full appearance-none px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors pr-9 ${className}`}
    >
      {children}
    </select>
    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
  </div>
);

// ─── Image Drop Zone ──────────────────────────────────────────────────────────

function ImageDropZone({ onFiles }) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    if (files.length) onFiles(files);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-2xl transition-colors cursor-pointer ${
        dragOver ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-gray-300 bg-gray-50"
      }`}
    >
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => onFiles(Array.from(e.target.files))}
        className="absolute inset-0 opacity-0 cursor-pointer"
      />
      <div className="flex flex-col items-center justify-center py-6 px-4 text-center pointer-events-none">
        <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center mb-2">
          <Upload size={18} className="text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-600">
          Drop images here or <span className="text-blue-500">browse</span>
        </p>
        <p className="text-xs text-gray-400 mt-0.5">PNG, JPG, WEBP — multiple allowed</p>
      </div>
    </div>
  );
}

// ─── Note Row ─────────────────────────────────────────────────────────────────

function NoteRow({ note, index, onChange, onRemove }) {
  const handleNoteImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Revoke the old preview URL before creating a new one to avoid memory leaks
    if (note.imagePreview && !note.existingUrl) {
      URL.revokeObjectURL(note.imagePreview);
    }

    onChange(index, {
      ...note,
      imageFile: file,
      imagePreview: URL.createObjectURL(file),
    });
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
      <label className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-200 border border-gray-200 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
        {note.imagePreview ? (
          <img src={note.imagePreview} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon size={14} className="text-gray-400" />
          </div>
        )}
        <input type="file" accept="image/*" onChange={handleNoteImageChange} className="sr-only" />
      </label>

      <input
        type="text"
        value={note.text}
        onChange={(e) => onChange(index, { ...note, text: e.target.value })}
        placeholder="e.g. Bergamot, Sandalwood, Musk…"
        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
      />

      <button
        type="button"
        onClick={() => onRemove(index)}
        className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: "",
  brand: "",
  description: "",
  price: "",
  stock: "",
  gender: "Men",
  concentration: "EDP",
  scentType: [],
  season: "All Seasons",
  isFeatured: false,
  isPublished: true,
};

const ProductModal = ({ isOpen, onClose, product, onSubmit, isLoading }) => {
  const [form, setForm] = useState(() => {
    if (!product) return EMPTY_FORM;
    return {
      name:          product.name          ?? "",
      brand:         product.brand?._id    ?? product.brand ?? "",
      description:   product.description   ?? "",
      price:         product.price         ?? "",
      stock:         product.stock         ?? "",
      gender:        product.gender        ?? "Men",
      concentration: product.concentration ?? "EDP",
      scentType:     product.scentType     ?? [],
      season:        product.season        ?? "All Seasons",
      isFeatured:    product.isFeatured    ?? false,
      isPublished:   product.isPublished   ?? true,
    };
  });

  const [newImages, setNewImages] = useState([]);
  const [existingImages, setExistingImages] = useState(
    product?.images?.map((img) => ({ ...img, markedForRemoval: false })) ?? []
  );

  // Fix: each note gets a stable `id` so we never use array index as React key
  const [notes, setNotes] = useState(
    product?.notes?.map((n) => ({
      id:           nextNoteId(),
      text:         n.text         ?? "",
      imagePreview: n.image?.url   ?? null,
      imageFile:    null,
      existingUrl:  n.image?.url   ?? null,
      existingId:   n.image?.publicId ?? null,
    })) ?? []
  );

  const { data: brands = [] } = useQuery({
    queryKey: ["brands"],
    queryFn: fetchBrands,
    staleTime: 60_000,
  });

  // ── Field helpers ──────────────────────────────────────────────────────────
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const toggleScentType = (type) => {
    setForm((f) => ({
      ...f,
      scentType: f.scentType.includes(type)
        ? f.scentType.filter((t) => t !== type)
        : [...f.scentType, type],
    }));
  };

  // Fix: revoke object URLs when new images are removed to avoid memory leaks
  const handleNewImages = useCallback((files) => {
    setNewImages((prev) => [
      ...prev,
      ...files.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    ]);
  }, []);

  const removeNewImage = useCallback((index) => {
    setNewImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const toggleExistingImageRemoval = (index) =>
    setExistingImages((prev) =>
      prev.map((img, i) => i === index ? { ...img, markedForRemoval: !img.markedForRemoval } : img)
    );

  const addNote = () =>
    setNotes((prev) => [
      ...prev,
      { id: nextNoteId(), text: "", imagePreview: null, imageFile: null, existingUrl: null, existingId: null },
    ]);

  const updateNote = (index, updated) =>
    setNotes((prev) => prev.map((n, i) => i === index ? updated : n));

  // Fix: revoke object URL for the removed note's image file preview
  const removeNote = (index) => {
    setNotes((prev) => {
      const note = prev[index];
      if (note.imagePreview && !note.existingUrl) {
        URL.revokeObjectURL(note.imagePreview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.name.trim())           return alert("Product name is required");
    if (!form.brand)                 return alert("Brand is required");
    if (!form.description.trim())    return alert("Description is required");
    if (form.price === "")           return alert("Price is required");
    if (form.stock === "")           return alert("Stock is required");
    if (form.scentType.length === 0) return alert("Select at least one scent type");
    if (notes.length === 0)          return alert("At least one note is required");
    if (!product && newImages.length === 0) return alert("At least one product image is required");

    // Validate every note has text
    for (const n of notes) {
      if (!n.text.trim()) return alert("All notes must have a text value");
    }

    // Fix: validate every note has an image (new file or existing) — mirrors backend requirement
    for (const n of notes) {
      if (!n.imageFile && !n.existingUrl) {
        return alert(`Note "${n.text || "(empty)"}" is missing an image`);
      }
    }

    const fd = new FormData();

    // ── Scalar strings ──────────────────────────────────────────────────────
    fd.append("name",          form.name.trim());
    fd.append("brand",         form.brand);
    fd.append("description",   form.description.trim());
    fd.append("price",         Number(form.price));
    fd.append("stock",         Number(form.stock));
    fd.append("gender",        form.gender);
    fd.append("concentration", form.concentration);
    fd.append("season",        form.season);

    // ── Booleans — send as strings "true"/"false", backend coerces via toBool
    fd.append("isFeatured",  form.isFeatured  ? "true" : "false");
    fd.append("isPublished", form.isPublished ? "true" : "false");

    // ── scentType — append each value separately so multer gives an array
    form.scentType.forEach((t) => fd.append("scentType", t));

    // ── Product image files
    newImages.forEach(({ file }) => fd.append("images", file));

    // ── Images to remove (edit mode)
    existingImages
      .filter((img) => img.markedForRemoval)
      .forEach((img) => fd.append("removeImages", img.publicId));

    // ── Notes
    notes.forEach((n, i) => {
      fd.append(`notes[${i}][text]`, n.text.trim());
      if (n.existingUrl) {
        fd.append(`notes[${i}][existingImageUrl]`, n.existingUrl);
        fd.append(`notes[${i}][existingImageId]`,  n.existingId ?? "");
      }
      if (n.imageFile) {
        fd.append(`noteImage_${i}`, n.imageFile);
      }
    });

    onSubmit(fd);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              {product ? "Edit Product" : "Add New Product"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {product ? "Update product details" : "Fill in the details to create a new fragrance"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Scrollable Body ──────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-7">

            {/* ── Basic Info ────────────────────────────────────────── */}
            <section>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Basic Info</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div className="sm:col-span-2">
                  <Label required>Product Name</Label>
                  <Input
                    type="text"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="e.g. Bleu de Chanel"
                  />
                </div>

                <div>
                  <Label required>Brand</Label>
                  <Select value={form.brand} onChange={(e) => set("brand", e.target.value)}>
                    <option value="">Select brand…</option>
                    {brands.map((b) => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Label required>Price (USD)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => set("price", e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label required>Stock</Label>
                  <Input
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(e) => set("stock", e.target.value)}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label required>Gender</Label>
                  <Select value={form.gender} onChange={(e) => set("gender", e.target.value)}>
                    {GENDERS.map((g) => <option key={g}>{g}</option>)}
                  </Select>
                </div>

                <div>
                  <Label required>Concentration</Label>
                  <Select value={form.concentration} onChange={(e) => set("concentration", e.target.value)}>
                    {CONCENTRATIONS.map((c) => <option key={c}>{c}</option>)}
                  </Select>
                </div>

                <div>
                  <Label required>Season</Label>
                  <Select value={form.season} onChange={(e) => set("season", e.target.value)}>
                    {SEASONS.map((s) => <option key={s}>{s}</option>)}
                  </Select>
                </div>

                <div className="sm:col-span-2">
                  <Label required>Description</Label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    placeholder="Describe the fragrance…"
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-none"
                  />
                </div>
              </div>
            </section>

            {/* ── Scent Type ────────────────────────────────────────── */}
            <section>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                Scent Type <span className="text-red-400">*</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {SCENT_TYPES.map((type) => {
                  const active = form.scentType.includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleScentType(type)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${
                        active
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* ── Images ────────────────────────────────────────────── */}
            <section>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                Product Images {!product && <span className="text-red-400">*</span>}
              </h3>

              {(existingImages.length > 0 || newImages.length > 0) && (
                <div className="flex flex-wrap gap-3 mb-3">
                  {existingImages.map((img, i) => (
                    <div key={img.publicId ?? i} className="relative group">
                      <img
                        src={img.url}
                        alt=""
                        className={`w-20 h-20 object-cover rounded-xl border-2 transition-all ${
                          img.markedForRemoval ? "opacity-40 border-red-400 grayscale" : "border-gray-100"
                        }`}
                      />
                      {img.isPrimary && !img.markedForRemoval && (
                        <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-amber-400 text-white px-1.5 py-0.5 rounded-full leading-none">
                          Primary
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => toggleExistingImageRemoval(i)}
                        className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs transition-colors ${
                          img.markedForRemoval ? "bg-gray-400 hover:bg-gray-500" : "bg-red-500 hover:bg-red-600"
                        }`}
                        title={img.markedForRemoval ? "Keep image" : "Remove image"}
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                  {newImages.map((img, i) => (
                    <div key={i} className="relative">
                      <img src={img.preview} alt="" className="w-20 h-20 object-cover rounded-xl border-2 border-blue-300" />
                      <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-blue-500 text-white px-1.5 py-0.5 rounded-full leading-none">
                        New
                      </span>
                      <button
                        type="button"
                        onClick={() => removeNewImage(i)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <ImageDropZone onFiles={handleNewImages} />
            </section>

            {/* ── Notes ─────────────────────────────────────────────── */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Fragrance Notes <span className="text-red-400">*</span>
                </h3>
                <button
                  type="button"
                  onClick={addNote}
                  className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Plus size={13} /> Add Note
                </button>
              </div>

              {notes.length === 0 ? (
                <div
                  onClick={addNote}
                  className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-gray-300 transition-colors text-gray-400"
                >
                  <Plus size={20} className="mb-1" />
                  <p className="text-sm font-medium">Add your first note</p>
                  <p className="text-xs mt-0.5">e.g. Bergamot, Sandalwood, Musk</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Fix: use stable note.id as key instead of array index */}
                  {notes.map((note, i) => (
                    <NoteRow key={note.id} note={note} index={i} onChange={updateNote} onRemove={removeNote} />
                  ))}
                </div>
              )}
            </section>

            {/* ── Visibility ────────────────────────────────────────── */}
            <section>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Visibility</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                {[
                  { key: "isPublished", label: "Published",  sub: "Visible to customers"      },
                  { key: "isFeatured",  label: "Featured",   sub: "Shown in featured section"  },
                ].map(({ key, label, sub }) => (
                  <label
                    key={key}
                    className={`flex items-center gap-3 flex-1 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      form[key]
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 bg-gray-50 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={form[key]}
                      onChange={(e) => set(key, e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      form[key] ? "border-white bg-white" : "border-gray-300"
                    }`}>
                      {form[key] && (
                        <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 text-gray-900 fill-current">
                          <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${form[key] ? "text-white" : "text-gray-900"}`}>{label}</p>
                      <p className={`text-xs mt-0.5 ${form[key] ? "text-white/70" : "text-gray-400"}`}>{sub}</p>
                    </div>
                  </label>
                ))}
              </div>
            </section>

          </div>

          {/* ── Footer ──────────────────────────────────────────────────── */}
          <div className="flex gap-3 px-6 py-5 border-t border-gray-100 bg-gray-50/50 sticky bottom-0">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading && <Loader2 size={15} className="animate-spin" />}
              {isLoading ? "Saving…" : product ? "Save Changes" : "Create Product"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;