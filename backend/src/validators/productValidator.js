import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID");

const ALLOWED_VOLUMES = [5, 10, 15, 30, 50, 75, 90, 100, 125, 150, 200];

const GENDERS = ["Men", "Women", "Unisex"];

const CONCENTRATIONS = ["EDC", "EDT", "EDP", "Parfum", "Extrait de Parfum"];


const SCENT_TYPES = [
  "Classic",
  "Floral",
  "Woody",
  "Fresh",
  "Oriental",
  "Citrus",
  "Aquatic",
  "Fruity",
  "Leather",
  "Sweet",
  "Powdery",
  "Spicy",
  "Aromatic",
  "Green",
  "Amber",
  "Musky",
  "Gourmand",
];


const SEASONS = ["Winter", "Spring", "Summer", "Autumn", "All Seasons"];

const variantSchema = z.object({
  volume: z.coerce
    .number()
    .refine((value) => ALLOWED_VOLUMES.includes(value), "Invalid volume"),

  price: z.coerce.number().min(0, "Price cannot be negative"),

  stock: z.coerce.number().int().min(0, "Stock cannot be negative"),
});

const notesSchema = z
  .object({
    top: z.array(objectId).default([]),
    heart: z.array(objectId).default([]),
    base: z.array(objectId).default([]),
  })
  .refine(
    (notes) =>
      notes.top.length + notes.heart.length + notes.base.length > 0,
    { message: "Product must contain at least one note" }
  );

export const createProductSchema = z.object({
  name: z.string().trim().min(2, "Product name is required").max(100),

  brand: objectId,

  description: z.string().trim().min(10, "Description is too short"),

  variants: z.array(variantSchema).min(1, "At least one variant is required"),

  gender: z.enum(GENDERS),

  concentration: z.enum(CONCENTRATIONS),

  scentType: z
    .array(z.enum(SCENT_TYPES))
    .min(1, "Select at least one scent type"),

  season: z.array(z.enum(SEASONS)).min(1, "Select at least one season"),

  notes: notesSchema,

  isFeatured: z.coerce.boolean().default(false),

  isPublished: z.coerce.boolean().default(true),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),

  limit: z.coerce.number().int().positive().max(100).optional(),

  search: z.string().optional(),

  brand: objectId.optional(),

  gender: z.enum(GENDERS).optional(),

  concentration: z.enum(CONCENTRATIONS).optional(),

  isFeatured: z.coerce.boolean().optional(),

  isPublished: z.coerce.boolean().optional(),
});

export const productIdSchema = z.object({
  id: objectId,
});