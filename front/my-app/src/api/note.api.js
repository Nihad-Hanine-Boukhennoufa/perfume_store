import instance from "./axios.js";

export const getAllNotes = async ({ family, search, page = 1, limit = 20 } = {}) => {
  const params = { page, limit };
  if (family) params.family = family;
  if (search) params.search = search;

  const { data } = await instance.get("/notes", { params });
  return data;
};

export const getNoteById = async (id) => {
  const { data } = await instance.get(`/notes/${id}`);
  return data.data;
};

export const createNote = async (formData) => {
  const { data } = await instance.post("/notes", formData);
  return data.data;
};

export const updateNote = async ({ id, formData }) => {
  const { data } = await instance.put(`/notes/${id}`, formData);
  return data.data;
};

export const deleteNote = async (id) => {
  const { data } = await instance.delete(`/notes/${id}`);
  return data;
};