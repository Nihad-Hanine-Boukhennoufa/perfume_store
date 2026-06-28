import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID");

const ALLOWED_VOLUMES = [5, 10, 15, 30, 50, 75, 90, 100, 125, 150, 200];

// ─── Buy Now ──────────────────────────────────────────────────────────────────
const buyNowSchema = z.object({
  buyNowProductId: objectId,

  buyNowVolume: z.coerce
    .number()
    .refine((v) => ALLOWED_VOLUMES.includes(v), "Invalid volume"),

  buyNowQuantity: z.coerce
    .number()
    .int()
    .min(1, "Quantity must be at least 1")
    .optional(),
});

// ─── Selected cart items ──────────────────────────────────────────────────────
const selectedItemSchema = z.object({
  productId: objectId,

  volume: z.coerce
    .number()
    .refine((v) => ALLOWED_VOLUMES.includes(v), "Invalid volume"),

  quantity: z.coerce
    .number()
    .int()
    .min(1)
    .optional(),
});

const selectedItemsSchema = z.object({
  selectedItems: z.array(selectedItemSchema).min(1, "Select at least one item"),
});

// ─── Buy all ──────────────────────────────────────────────────────────────────
const buyAllSchema = z.object({
  buyAll: z.literal(true),
});

// ─── Combined — exactly one mode must be provided ─────────────────────────────
export const createOrderSchema = z
  .union([buyNowSchema, selectedItemsSchema, buyAllSchema])
  .refine(Boolean, { message: "No products selected for order" });