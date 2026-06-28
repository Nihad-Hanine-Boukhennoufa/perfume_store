import { z } from "zod";

const NOTE_FAMILIES = [
  "Citrus",
  "Floral",
  "Woody",
  "Oriental",
  "Fresh",
  "Fruity",
  "Spicy",
  "Aromatic",
  "Sweet",
  "Leather",
  "Aquatic",
  "Powdery",
  "Green",
  "Musky",
  "Amber",
  "Gourmand",
];

export const createNoteSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Note name is too short")
    .max(50, "Note name is too long"),

  family: z.enum(NOTE_FAMILIES, {
    errorMap: () => ({ message: "Invalid note family" }),
  }),
});

export const updateNoteSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Note name is too short")
    .max(50, "Note name is too long")
    .optional(),

  family: z
    .enum(NOTE_FAMILIES, { errorMap: () => ({ message: "Invalid note family" }) })
    .optional(),
});