import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Upload, Plus, Trash2, ChevronDown } from "lucide-react";
import { getAllBrands } from "../../api/brand.api.js";
import { getAllNotes  } from "../../api/note.api.js";

// ─── Constants (mirror schema enums exactly) ──────────────────────────────────

const ALLOWED_VOLUMES  = [5, 10, 15, 30, 50, 75, 90, 100, 125, 150, 200];
const GENDERS          = ["Men", "Women", "Unisex"];
const CONCENTRATIONS   = ["EDC", "EDT", "EDP", "Parfum", "Extrait de Parfum"];
const SCENT_TYPES      = [
  "Classic","Floral","Woody","Fresh","Oriental","Citrus","Aquatic",
  "Fruity","Leather","Sweet","Powdery","Spicy","Aromatic","Green","Amber","Musky","Gourmand",
];
const SEASONS          = ["Winter", "Spring", "Summer", "Autumn", "All Seasons"];
const NOTE_LEVELS      = ["top", "heart", "base"];

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputStyle = {
  background: "var(--color-charcoal)", border: "0.5px solid var(--color-smoke)",
  color: "var(--color-pearl)", fontFamily: "var(--font-body)", borderRadius: 0,
  width: "100%", outline: "none", fontSize: "13px",
  padding: "11px 14px", transition: "border-color .2s",
};

const LuxLabel = ({ children, required }) => (
  <label className="block text-[9px] tracking-[3px] uppercase mb-2"
    style={{ color: "var(--color-mist)", fontFamily: "var(--font-body)" }}>
    {children}{required && <span style={{ color: "#c08080" }}> *</span>}
  </label>
);

const LuxInput = ({ ...props }) => (
  <input {...props} style={inputStyle}
    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-gold)")}
    onBlur={(e)  => (e.currentTarget.style.borderColor = "var(--color-smoke)")}
  />
);

const LuxSelect = ({ children, ...props }) => (
  <div className="relative">
    <select {...props}
      style={{ ...inputStyle, appearance: "none", paddingRight: 36 }}
      onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-gold)")}
      onBlur={(e)  => (e.currentTarget.style.borderColor = "var(--color-smoke)")}
    >{children}</select>
    <ChevronDown size={13} strokeWidth={1.5}
      className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
      style={{ color: "var(--color-smoke)" }} />
  </div>
);

const SectionTitle = ({ children }) => (
  <p className="text-[9px] tracking-[4px] uppercase mb-4 pb-2"
    style={{ color: "var(--color-gold)", fontFamily: "var(--font-body)", borderBottom: "0.5px solid var(--color-charcoal)" }}>
    {children}
  </p>
);

// ─── Variant Row ─────────────────────────────────────────────────────────────

function VariantRow({ variant, onChange, onRemove, usedVolumes }) {
  const available = ALLOWED_VOLUMES.filter(
    (v) => v === variant.volume || !usedVolumes.includes(v)
  );
  return (
    <div className="flex items-center gap-2 p-3"
      style={{ background: "var(--color-obsidian)", border: "0.5px solid var(--color-charcoal)" }}>
      {/* Volume */}
      <div className="relative" style={{ minWidth: 90 }}>
        <select value={variant.volume}
          onChange={(e) => onChange({ ...variant, volume: Number(e.target.value) })}
          style={{ ...inputStyle, appearance: "none", paddingRight: 28, padding: "8px 28px 8px 10px", fontSize: 12 }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-gold)")}
          onBlur={(e)  => (e.currentTarget.style.borderColor = "var(--color-smoke)")}
        >
          {available.map((v) => (
            <option key={v} value={v} style={{ background: "var(--color-ink)" }}>{v} ml</option>
          ))}
        </select>
        <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: "var(--color-smoke)" }} />
      </div>
      {/* Price */}
      <input type="number" min="0" step="0.01" placeholder="Price $"
        value={variant.price}
        onChange={(e) => onChange({ ...variant, price: e.target.value })}
        style={{ ...inputStyle, padding: "8px 10px", fontSize: 12, flex: 1 }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-gold)")}
        onBlur={(e)  => (e.currentTarget.style.borderColor = "var(--color-smoke)")}
      />
      {/* Stock */}
      <input type="number" min="0" placeholder="Stock"
        value={variant.stock}
        onChange={(e) => onChange({ ...variant, stock: e.target.value })}
        style={{ ...inputStyle, padding: "8px 10px", fontSize: 12, flex: 1 }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-gold)")}
        onBlur={(e)  => (e.currentTarget.style.borderColor = "var(--color-smoke)")}
      />
      {/* Available toggle */}
      <button type="button"
        onClick={() => onChange({ ...variant, isAvailable: !variant.isAvailable })}
        className="text-[9px] tracking-[1px] uppercase px-2 py-1.5 shrink-0 transition-all duration-150"
        style={{
          color:      variant.isAvailable ? "#70a880"            : "var(--color-smoke)",
          background: variant.isAvailable ? "rgba(30,80,50,0.2)" : "transparent",
          border:     `0.5px solid ${variant.isAvailable ? "rgba(60,120,80,0.3)" : "var(--color-charcoal)"}`,
          fontFamily: "var(--font-body)", borderRadius: 0, cursor: "pointer",
        }}>
        {variant.isAvailable ? "In stock" : "Out"}
      </button>
      {/* Remove */}
      <button type="button" onClick={onRemove}
        className="p-1.5 shrink-0 transition-colors duration-150"
        style={{ color: "var(--color-smoke)", background: "none", border: "none", cursor: "pointer" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#c08080")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-smoke)")}
      ><Trash2 size={13} strokeWidth={1.5} /></button>
    </div>
  );
}

// ─── Image Drop Zone ──────────────────────────────────────────────────────────

function ImageDropZone({ onFiles }) {
  const [drag, setDrag] = useState(false);
  const handleDrop = (e) => {
    e.preventDefault(); setDrag(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    if (files.length) onFiles(files);
  };
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
      className="relative flex flex-col items-center justify-center gap-3 py-6 cursor-pointer transition-all duration-200"
      style={{ border: `0.5px dashed ${drag ? "var(--color-gold)" : "var(--color-smoke)"}`, background: drag ? "rgba(201,168,76,0.04)" : "transparent" }}
    >
      <input type="file" accept="image/*" multiple
        onChange={(e) => onFiles(Array.from(e.target.files))}
        className="absolute inset-0 opacity-0 cursor-pointer" />
      <div className="w-10 h-10 flex items-center justify-center"
        style={{ background: "rgba(201,168,76,0.08)", border: "0.5px solid var(--color-gold-dark)" }}>
        <Upload size={16} strokeWidth={1.5} style={{ color: "var(--color-gold)" }} />
      </div>
      <p className="text-[10px] tracking-[1px] pointer-events-none"
        style={{ color: "var(--color-smoke)", fontFamily: "var(--font-body)" }}>
        Drop images or click to browse · multiple allowed
      </p>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const DEFAULT_VARIANT = () => ({ volume: 50, price: "", stock: "", isAvailable: true });

const ProductModal = ({ isOpen, onClose, product, onSubmit, isLoading }) => {

  // ── Form state ─────────────────────────────────────────────────────────────
  const [form, setForm] = useState(() => ({
    name:          product?.name          ?? "",
    brand:         product?.brand?._id    ?? product?.brand ?? "",
    description:   product?.description   ?? "",
    gender:        product?.gender        ?? "Men",
    concentration: product?.concentration ?? "EDP",
    scentType:     product?.scentType     ?? [],
    season:        product?.season        ?? [],
    isFeatured:    product?.isFeatured    ?? false,
    isPublished:   product?.isPublished   ?? true,
  }));

  const [variants, setVariants] = useState(
    product?.variants?.length
      ? product.variants.map((v) => ({ volume: v.volume, price: v.price, stock: v.stock, isAvailable: v.isAvailable ?? true }))
      : [DEFAULT_VARIANT()]
  );

  // notes: { top: [id,...], heart: [id,...], base: [id,...] }
  const [notes, setNotes] = useState({
    top:   product?.notes?.top?.map   ((n) => n._id ?? n) ?? [],
    heart: product?.notes?.heart?.map ((n) => n._id ?? n) ?? [],
    base:  product?.notes?.base?.map  ((n) => n._id ?? n) ?? [],
  });

  const [newImages,      setNewImages]      = useState([]);
  const [existingImages, setExistingImages] = useState(
    product?.images?.map((img) => ({ ...img, markedForRemoval: false })) ?? []
  );
  const [error, setError] = useState("");

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: brands = [] } = useQuery({ queryKey: ["brands"], queryFn: getAllBrands, staleTime: 60_000 });
  const { data: notesData }   = useQuery({
    queryKey: ["notes", { limit: 200 }],
    queryFn:  () => getAllNotes({ limit: 200 }),
    staleTime: 60_000,
  });
  const allNotes = notesData?.data ?? [];

  // ── Helpers ────────────────────────────────────────────────────────────────
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const toggleArray = (key, value) =>
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value],
    }));

  const usedVolumes = variants.map((v) => v.volume);

  const addVariant = () => {
    const unused = ALLOWED_VOLUMES.find((v) => !usedVolumes.includes(v));
    if (unused) setVariants((prev) => [...prev, { ...DEFAULT_VARIANT(), volume: unused }]);
  };

  const updateVariant = (i, updated) =>
    setVariants((prev) => prev.map((v, idx) => idx === i ? updated : v));

  const removeVariant = (i) =>
    setVariants((prev) => prev.filter((_, idx) => idx !== i));

  const toggleNote = (level, noteId) =>
    setNotes((prev) => ({
      ...prev,
      [level]: prev[level].includes(noteId)
        ? prev[level].filter((id) => id !== noteId)
        : [...prev[level], noteId],
    }));

  const handleNewImages = useCallback((files) => {
    setNewImages((prev) => [
      ...prev,
      ...files.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    ]);
  }, []);

  const removeNewImage = useCallback((i) => {
    setNewImages((prev) => {
      URL.revokeObjectURL(prev[i].preview);
      return prev.filter((_, idx) => idx !== i);
    });
  }, []);

  const toggleExistingRemoval = (i) =>
    setExistingImages((prev) =>
      prev.map((img, idx) => idx === i ? { ...img, markedForRemoval: !img.markedForRemoval } : img)
    );

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim())         return setError("Product name is required");
    if (!form.brand)               return setError("Brand is required");
    if (!form.description.trim())  return setError("Description is required");
    if (form.scentType.length === 0) return setError("Select at least one scent type");
    if (form.season.length === 0)  return setError("Select at least one season");
    if (variants.length === 0)     return setError("Add at least one variant");

    for (const v of variants) {
      if (!v.price || !v.stock) return setError("All variants must have price and stock");
    }

    const totalNotes = notes.top.length + notes.heart.length + notes.base.length;
    if (totalNotes === 0) return setError("Add at least one fragrance note");

    const keepImages = existingImages.filter((img) => !img.markedForRemoval);
    if (!product && newImages.length === 0) return setError("At least one product image is required");
    if (product && keepImages.length === 0 && newImages.length === 0)
      return setError("Product must have at least one image");

    const fd = new FormData();
    fd.append("name",          form.name.trim());
    fd.append("brand",         form.brand);
    fd.append("description",   form.description.trim());
    fd.append("gender",        form.gender);
    fd.append("concentration", form.concentration);
    fd.append("isFeatured",    form.isFeatured  ? "true" : "false");
    fd.append("isPublished",   form.isPublished ? "true" : "false");

    fd.append("variants",  JSON.stringify(
      variants.map((v) => ({ volume: Number(v.volume), price: Number(v.price), stock: Number(v.stock), isAvailable: v.isAvailable }))
    ));
    fd.append("scentType", JSON.stringify(form.scentType));
    fd.append("season",    JSON.stringify(form.season));
    fd.append("notes",     JSON.stringify(notes));

    newImages.forEach(({ file }) => fd.append("images", file));

    existingImages
      .filter((img) => img.markedForRemoval)
      .forEach((img) => fd.append("removeImages", img.publicId));

    onSubmit(fd);
  };

  if (!isOpen) return null;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-3xl flex flex-col" style={{ maxHeight: "92vh", background: "var(--color-ink)", border: "0.5px solid var(--color-charcoal)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 shrink-0"
          style={{ borderBottom: "0.5px solid var(--color-charcoal)" }}>
          <div>
            <p className="text-[9px] tracking-[4px] uppercase"
              style={{ color: "var(--color-gold)", fontFamily: "var(--font-body)" }}>
              {product ? "Edit" : "New"} Product
            </p>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "24px", color: "var(--color-pearl)" }}>
              {product ? "Update Product" : "Add Product"}
            </h3>
          </div>
          <button onClick={onClose}
            style={{ color: "var(--color-smoke)", background: "none", border: "none", cursor: "pointer" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-mist)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-smoke)")}
          ><X size={16} strokeWidth={1.5} /></button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 flex flex-col gap-8">

            {/* Error */}
            {error && (
              <p className="text-xs px-4 py-3"
                style={{ background: "rgba(160,60,60,0.1)", border: "0.5px solid rgba(160,60,60,0.3)", color: "#c08080", fontFamily: "var(--font-body)" }}>
                {error}
              </p>
            )}

            {/* ── Basic Info ── */}
            <section>
              <SectionTitle>Basic Info</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <LuxLabel required>Product Name</LuxLabel>
                  <LuxInput type="text" value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="e.g. Bleu de Chanel" />
                </div>
                <div>
                  <LuxLabel required>Brand</LuxLabel>
                  <LuxSelect value={form.brand} onChange={(e) => set("brand", e.target.value)}>
                    <option value="" style={{ background: "var(--color-ink)" }}>Select brand…</option>
                    {brands.map((b) => <option key={b._id} value={b._id} style={{ background: "var(--color-ink)" }}>{b.name}</option>)}
                  </LuxSelect>
                </div>
                <div>
                  <LuxLabel required>Gender</LuxLabel>
                  <LuxSelect value={form.gender} onChange={(e) => set("gender", e.target.value)}>
                    {GENDERS.map((g) => <option key={g} style={{ background: "var(--color-ink)" }}>{g}</option>)}
                  </LuxSelect>
                </div>
                <div>
                  <LuxLabel required>Concentration</LuxLabel>
                  <LuxSelect value={form.concentration} onChange={(e) => set("concentration", e.target.value)}>
                    {CONCENTRATIONS.map((c) => <option key={c} style={{ background: "var(--color-ink)" }}>{c}</option>)}
                  </LuxSelect>
                </div>
                <div className="sm:col-span-2">
                  <LuxLabel required>Description</LuxLabel>
                  <textarea rows={3} value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    placeholder="Describe the fragrance…"
                    style={{ ...inputStyle, resize: "none" }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-gold)")}
                    onBlur={(e)  => (e.currentTarget.style.borderColor = "var(--color-smoke)")}
                  />
                </div>
              </div>
            </section>

            {/* ── Variants ── */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <SectionTitle>Variants (Size & Price)</SectionTitle>
                <button type="button" onClick={addVariant}
                  disabled={usedVolumes.length === ALLOWED_VOLUMES.length}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] tracking-[2px] uppercase transition-all duration-150 disabled:opacity-30"
                  style={{ color: "var(--color-gold)", border: "0.5px solid rgba(201,168,76,0.3)", background: "rgba(201,168,76,0.06)", fontFamily: "var(--font-body)", borderRadius: 0, cursor: "pointer" }}>
                  <Plus size={11} strokeWidth={1.5} /> Add Size
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {variants.map((v, i) => (
                  <VariantRow key={i} variant={v}
                    onChange={(updated) => updateVariant(i, updated)}
                    onRemove={() => removeVariant(i)}
                    usedVolumes={usedVolumes.filter((_, idx) => idx !== i)}
                  />
                ))}
              </div>
              {variants.length === 0 && (
                <button type="button" onClick={addVariant}
                  className="w-full flex items-center justify-center gap-2 py-6 transition-all duration-200"
                  style={{ border: "0.5px dashed var(--color-smoke)", color: "var(--color-smoke)", background: "none", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 12 }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-gold)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-smoke)")}
                ><Plus size={14} strokeWidth={1.5} /> Add first variant</button>
              )}
            </section>

            {/* ── Scent Type ── */}
            <section>
              <SectionTitle>Scent Type *</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {SCENT_TYPES.map((type) => {
                  const active = form.scentType.includes(type);
                  return (
                    <button key={type} type="button" onClick={() => toggleArray("scentType", type)}
                      className="px-3 py-1.5 text-[10px] tracking-[1px] uppercase transition-all duration-150"
                      style={{
                        color:      active ? "var(--color-obsidian)" : "var(--color-mist)",
                        background: active ? "var(--color-gold)"     : "transparent",
                        border:     `0.5px solid ${active ? "var(--color-gold)" : "var(--color-charcoal)"}`,
                        fontFamily: "var(--font-body)", borderRadius: 0, cursor: "pointer",
                      }}>
                      {type}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* ── Season ── */}
            <section>
              <SectionTitle>Season *</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {SEASONS.map((s) => {
                  const active = form.season.includes(s);
                  return (
                    <button key={s} type="button" onClick={() => toggleArray("season", s)}
                      className="px-3 py-1.5 text-[10px] tracking-[1px] uppercase transition-all duration-150"
                      style={{
                        color:      active ? "var(--color-obsidian)" : "var(--color-mist)",
                        background: active ? "var(--color-gold)"     : "transparent",
                        border:     `0.5px solid ${active ? "var(--color-gold)" : "var(--color-charcoal)"}`,
                        fontFamily: "var(--font-body)", borderRadius: 0, cursor: "pointer",
                      }}>
                      {s}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* ── Fragrance Notes ── */}
            <section>
              <SectionTitle>Fragrance Notes *</SectionTitle>
              <div className="flex flex-col gap-5">
                {NOTE_LEVELS.map((level) => (
                  <div key={level}>
                    <p className="text-[9px] tracking-[3px] uppercase mb-3"
                      style={{ color: "var(--color-mist)", fontFamily: "var(--font-body)" }}>
                      {level.charAt(0).toUpperCase() + level.slice(1)} Notes
                      <span style={{ color: "var(--color-smoke)" }}> · {notes[level].length} selected</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {allNotes.map((note) => {
                        const selected = notes[level].includes(note._id);
                        const inOther  = NOTE_LEVELS.filter((l) => l !== level).some((l) => notes[l].includes(note._id));
                        return (
                          <button key={note._id} type="button"
                            onClick={() => !inOther && toggleNote(level, note._id)}
                            disabled={inOther}
                            title={inOther ? "Already used in another level" : ""}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] tracking-[1px] uppercase transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
                            style={{
                              color:      selected ? "var(--color-obsidian)" : "var(--color-mist)",
                              background: selected ? "var(--color-gold)"     : "transparent",
                              border:     `0.5px solid ${selected ? "var(--color-gold)" : "var(--color-charcoal)"}`,
                              fontFamily: "var(--font-body)", borderRadius: 0, cursor: inOther ? "not-allowed" : "pointer",
                            }}>
                            {note.image && (
                              <img src={note.image} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />
                            )}
                            {note.name}
                          </button>
                        );
                      })}
                      {allNotes.length === 0 && (
                        <p className="text-[10px]" style={{ color: "var(--color-smoke)", fontFamily: "var(--font-body)" }}>
                          No notes found — add notes in the Notes section first.
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Images ── */}
            <section>
              <SectionTitle>Product Images {!product && "*"}</SectionTitle>
              {(existingImages.length > 0 || newImages.length > 0) && (
                <div className="flex flex-wrap gap-3 mb-4">
                  {existingImages.map((img, i) => (
                    <div key={img.publicId ?? i} className="relative">
                      <div className="overflow-hidden"
                        style={{ width: 72, height: 72, border: `0.5px solid ${img.markedForRemoval ? "rgba(160,60,60,0.5)" : "var(--color-charcoal)"}`, opacity: img.markedForRemoval ? 0.4 : 1 }}>
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                      </div>
                      {img.isPrimary && !img.markedForRemoval && (
                        <span className="absolute bottom-1 left-1 text-[8px] tracking-[1px] uppercase px-1 py-0.5"
                          style={{ background: "var(--color-gold)", color: "var(--color-obsidian)", fontFamily: "var(--font-body)" }}>
                          Main
                        </span>
                      )}
                      <button type="button" onClick={() => toggleExistingRemoval(i)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full"
                        style={{ background: img.markedForRemoval ? "var(--color-smoke)" : "#c08080", border: "1.5px solid var(--color-ink)", cursor: "pointer" }}>
                        <X size={9} style={{ color: "#fff" }} />
                      </button>
                    </div>
                  ))}
                  {newImages.map((img, i) => (
                    <div key={i} className="relative">
                      <div className="overflow-hidden"
                        style={{ width: 72, height: 72, border: "0.5px solid rgba(201,168,76,0.4)" }}>
                        <img src={img.preview} alt="" className="w-full h-full object-cover" />
                      </div>
                      <span className="absolute bottom-1 left-1 text-[8px] tracking-[1px] uppercase px-1 py-0.5"
                        style={{ background: "rgba(201,168,76,0.8)", color: "var(--color-obsidian)", fontFamily: "var(--font-body)" }}>
                        New
                      </span>
                      <button type="button" onClick={() => removeNewImage(i)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full"
                        style={{ background: "#c08080", border: "1.5px solid var(--color-ink)", cursor: "pointer" }}>
                        <X size={9} style={{ color: "#fff" }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <ImageDropZone onFiles={handleNewImages} />
            </section>

            {/* ── Visibility ── */}
            <section>
              <SectionTitle>Visibility</SectionTitle>
              <div className="flex flex-col sm:flex-row gap-3">
                {[
                  { key: "isPublished", label: "Published",  sub: "Visible to customers"     },
                  { key: "isFeatured",  label: "Featured",   sub: "Shown in featured section" },
                ].map(({ key, label, sub }) => (
                  <label key={key}
                    className="flex items-center gap-3 flex-1 p-4 cursor-pointer transition-all duration-200"
                    style={{
                      background: form[key] ? "rgba(201,168,76,0.08)" : "transparent",
                      border:     `0.5px solid ${form[key] ? "var(--color-gold)" : "var(--color-charcoal)"}`,
                    }}>
                    <input type="checkbox" checked={form[key]}
                      onChange={(e) => set(key, e.target.checked)} className="sr-only" />
                    <div className="w-4 h-4 flex items-center justify-center shrink-0"
                      style={{ background: form[key] ? "var(--color-gold)" : "transparent", border: `0.5px solid ${form[key] ? "var(--color-gold)" : "var(--color-smoke)"}` }}>
                      {form[key] && <svg viewBox="0 0 12 12" className="w-2.5 h-2.5" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="var(--color-obsidian)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>}
                    </div>
                    <div>
                      <p className="text-xs font-medium" style={{ color: form[key] ? "var(--color-gold)" : "var(--color-pearl)", fontFamily: "var(--font-body)" }}>{label}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: "var(--color-smoke)", fontFamily: "var(--font-body)" }}>{sub}</p>
                    </div>
                  </label>
                ))}
              </div>
            </section>

          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-5 shrink-0"
            style={{ borderTop: "0.5px solid var(--color-charcoal)", background: "var(--color-obsidian)" }}>
            <button type="submit" disabled={isLoading}
              className="flex-1 py-3 text-[10px] tracking-[2px] uppercase transition-all duration-200 disabled:opacity-50"
              style={{ background: "var(--color-gold)", color: "var(--color-obsidian)", border: "none", fontFamily: "var(--font-body)", borderRadius: 0, cursor: "pointer" }}
              onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.background = "var(--color-gold-light)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-gold)"; }}
            >{isLoading ? "Saving…" : product ? "Save Changes" : "Create Product"}</button>
            <button type="button" onClick={onClose} disabled={isLoading}
              className="px-8 py-3 text-[10px] tracking-[2px] uppercase transition-all duration-200"
              style={{ background: "transparent", color: "var(--color-mist)", border: "0.5px solid var(--color-charcoal)", fontFamily: "var(--font-body)", borderRadius: 0, cursor: "pointer" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-smoke)"; e.currentTarget.style.color = "var(--color-pearl)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-charcoal)"; e.currentTarget.style.color = "var(--color-mist)"; }}
            >Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;