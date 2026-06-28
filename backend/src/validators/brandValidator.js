import { z } from "zod";

export const createBrandSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Brand name is too short")
    .max(50, "Brand name is too long"),
});


export const updateBrandSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Brand name is too short")
    .max(50, "Brand name is too long")
    .optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided" }
);