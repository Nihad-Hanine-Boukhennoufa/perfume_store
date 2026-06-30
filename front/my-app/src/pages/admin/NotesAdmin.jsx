import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusCircle, Edit2, Trash2, Search, Leaf, AlertTriangle } from "lucide-react";
import { getAllNotes, createNote, updateNote, deleteNote } from "../../api/note.api.js";
import NoteModal  from "../../components/modals/NoteModal.jsx";
import DeleteModal from "../../components/modals/DeleteModal.jsx";

const NOTE_FAMILIES = [
  "Citrus","Floral","Woody","Oriental","Fresh","Fruity","Spicy",
  "Aromatic","Sweet","Leather","Aquatic","Powdery","Green","Musky","Amber","Gourmand",
];

const NotesAdmin = () => {
  const [searchTerm,    setSearchTerm]    = useState("");
  const [familyFilter,  setFamilyFilter]  = useState("");
  const [isModalOpen,   setIsModalOpen]   = useState(false);
  const [isDeleteOpen,  setIsDeleteOpen]  = useState(false);
  const [selectedNote,  setSelectedNote]  = useState(null);
  const [noteToDelete,  setNoteToDelete]  = useState(null);

  const queryClient = useQueryClient();
  const invalidate  = () => queryClient.invalidateQueries({ queryKey: ["notes"] });

  const { data, isLoading, error } = useQuery({
    queryKey: ["notes", { family: familyFilter, search: searchTerm }],
    queryFn:  () => getAllNotes({ family: familyFilter, search: searchTerm, limit: 100 }),
  });

  const notes = data?.data ?? [];

  const createMutation = useMutation({
    mutationFn: createNote,
    onSuccess:  () => { invalidate(); setIsModalOpen(false); },
    onError:    (err) => alert(err.response?.data?.message || err.message),
  });

  const updateMutation = useMutation({
    mutationFn: updateNote,
    onSuccess:  () => { invalidate(); setIsModalOpen(false); setSelectedNote(null); },
    onError:    (err) => alert(err.response?.data?.message || err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNote,
    onSuccess:  () => { invalidate(); setIsDeleteOpen(false); setNoteToDelete(null); },
    onError:    (err) => alert(err.response?.data?.message || err.message),
  });

  const handleSubmit = (formData) =>
    selectedNote
      ? updateMutation.mutate({ id: selectedNote._id, formData })
      : createMutation.mutate(formData);

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 lg:p-8" style={{ background: "var(--color-obsidian)", minHeight: "100vh" }}>
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <p className="text-[9px] tracking-[5px] uppercase mb-1"
              style={{ color: "var(--color-gold)", fontFamily: "var(--font-body)" }}>Admin</p>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "36px", fontWeight: 400, color: "var(--color-pearl)" }}>
              Fragrance Notes
            </h1>
          </div>
          <button
            onClick={() => { setSelectedNote(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-5 py-3 text-[10px] tracking-[2px] uppercase transition-all duration-200 w-fit"
            style={{ background: "var(--color-gold)", color: "var(--color-obsidian)", fontFamily: "var(--font-body)", borderRadius: 0, border: "none", cursor: "pointer" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-gold-light)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--color-gold)")}
          >
            <PlusCircle size={14} strokeWidth={1.5} /> Add Note
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4"
          style={{ background: "var(--color-ink)", border: "0.5px solid var(--color-charcoal)" }}>
          <div className="relative flex-1 max-w-sm">
            <Search size={14} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--color-smoke)" }} />
            <input type="text" placeholder="Search notes…" value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs outline-none"
              style={{ background: "var(--color-charcoal)", border: "0.5px solid var(--color-smoke)", color: "var(--color-pearl)", fontFamily: "var(--font-body)", borderRadius: 0 }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-gold)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-smoke)")}
            />
          </div>
          <select value={familyFilter} onChange={(e) => setFamilyFilter(e.target.value)}
            className="py-2.5 px-3 text-xs outline-none"
            style={{ background: "var(--color-charcoal)", border: "0.5px solid var(--color-smoke)", color: "var(--color-pearl)", fontFamily: "var(--font-body)", borderRadius: 0 }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-gold)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-smoke)")}
          >
            <option value="">All Families</option>
            {NOTE_FAMILIES.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
          <p className="text-[10px] tracking-[1px] self-center shrink-0"
            style={{ color: "var(--color-mist)", fontFamily: "var(--font-body)" }}>
            <span style={{ color: "var(--color-pearl)" }}>{notes.length}</span> notes
          </p>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse"
                style={{ background: "var(--color-ink)", border: "0.5px solid var(--color-charcoal)" }} />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center py-16"
            style={{ border: "0.5px solid var(--color-charcoal)" }}>
            <AlertTriangle size={28} strokeWidth={1} style={{ color: "#c08080", marginBottom: 12 }} />
            <p className="text-sm" style={{ color: "#c08080", fontFamily: "var(--font-body)" }}>
              Error loading notes: {error.message}
            </p>
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center py-20"
            style={{ border: "0.5px solid var(--color-charcoal)" }}>
            <Leaf size={32} strokeWidth={1} style={{ color: "var(--color-charcoal)", marginBottom: 16 }} />
            <p style={{ fontFamily: "var(--font-display)", fontSize: "20px", color: "var(--color-mist)", marginBottom: 6 }}>
              {searchTerm || familyFilter ? "No notes match your filters" : "No notes yet"}
            </p>
            {!searchTerm && !familyFilter && (
              <button onClick={() => setIsModalOpen(true)}
                className="mt-6 px-8 py-3 text-[10px] tracking-[3px] uppercase"
                style={{ background: "var(--color-gold)", color: "var(--color-obsidian)", fontFamily: "var(--font-body)", border: "none", borderRadius: 0, cursor: "pointer" }}>
                Add First Note
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {notes.map((note) => (
              <div key={note._id} className="group flex flex-col gap-3 p-4 transition-all duration-200"
                style={{ background: "var(--color-ink)", border: "0.5px solid var(--color-charcoal)" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-gold)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-charcoal)")}
              >
                {/* Image */}
                <div className="overflow-hidden mx-auto"
                  style={{ width: 56, height: 56, background: "var(--color-obsidian)", border: "0.5px solid var(--color-charcoal)", borderRadius: "50%" }}>
                  {note.image
                    ? <img src={note.image} alt={note.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center">
                        <Leaf size={18} strokeWidth={1} style={{ color: "var(--color-charcoal)" }} />
                      </div>
                  }
                </div>
                <div className="text-center min-w-0">
                  <p className="text-xs font-medium truncate"
                    style={{ color: "var(--color-pearl)", fontFamily: "var(--font-body)" }}>{note.name}</p>
                  <p className="text-[10px] mt-0.5"
                    style={{ color: "var(--color-gold)", fontFamily: "var(--font-body)" }}>{note.family}</p>
                </div>
                <div className="flex items-center gap-2 pt-2"
                  style={{ borderTop: "0.5px solid var(--color-charcoal)" }}>
                  <button onClick={() => { setSelectedNote(note); setIsModalOpen(true); }}
                    className="flex-1 flex items-center justify-center py-1.5 text-[10px] tracking-[1px] uppercase transition-colors duration-150"
                    style={{ color: "var(--color-mist)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-body)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-gold)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-mist)")}
                  ><Edit2 size={11} strokeWidth={1.5} /></button>
                  <div style={{ width: "0.5px", height: 14, background: "var(--color-charcoal)" }} />
                  <button onClick={() => { setNoteToDelete(note); setIsDeleteOpen(true); }}
                    className="flex-1 flex items-center justify-center py-1.5 text-[10px] tracking-[1px] uppercase transition-colors duration-150"
                    style={{ color: "var(--color-smoke)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-body)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#c08080")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-smoke)")}
                  ><Trash2 size={11} strokeWidth={1.5} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <NoteModal
        key={selectedNote?._id ?? "new"}
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedNote(null); }}
        note={selectedNote}
        onSubmit={handleSubmit}
        isLoading={isMutating}
      />
      <DeleteModal
        isOpen={isDeleteOpen}
        onClose={() => { setIsDeleteOpen(false); setNoteToDelete(null); }}
        onConfirm={() => deleteMutation.mutate(noteToDelete._id)}
        itemName={noteToDelete?.name}
        itemType="note"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default NotesAdmin;