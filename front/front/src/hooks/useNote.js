import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
} from "../api/note.api";

export const useNotes = ({ family, search, page, limit } = {}) => {
  return useQuery({
    queryKey: ["notes", { family, search, page, limit }],
    queryFn:  () => getAllNotes({ family, search, page, limit }),
  });
};

export const useNote = (id) => {
  return useQuery({
    queryKey: ["note", id],
    queryFn:  () => getNoteById(id),
    enabled:  !!id,
  });
};

export const useCreateNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createNote, // FormData
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notes"] }),
  });
};

export const useUpdateNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateNote, // { id, formData }
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notes"] }),
  });
};

export const useDeleteNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteNote, // id
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notes"] }),
  });
};