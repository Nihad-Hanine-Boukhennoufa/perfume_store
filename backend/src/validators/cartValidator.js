import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID");

const ALLOWED_VOLUMES = [5, 10, 15, 30, 50, 75, 90, 100, 125, 150, 200];

export const addToCartSchema = z.object({
  productId: objectId,

  volume: z.coerce
    .number()
    .refine((v) => ALLOWED_VOLUMES.includes(v), "Invalid volume"),

  quantity: z.coerce
    .number()
    .int()
    .min(1, "Quantity must be at least 1"),
});

export const updateCartItemSchema = z.object({
  volume: z.coerce
    .number()
    .refine((v) => ALLOWED_VOLUMES.includes(v), "Invalid volume"),

  quantity: z.coerce
    .number()
    .int()
    .min(1, "Quantity must be at least 1"),
});