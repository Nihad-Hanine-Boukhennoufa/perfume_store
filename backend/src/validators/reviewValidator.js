import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID");

export const addReviewSchema = z.object({
  productId: objectId,

  rating: z.coerce
    .number()
    .int()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating cannot exceed 5"),

  comment: z
    .string()
    .trim()
    .min(3, "Comment is too short")
    .max(1000, "Comment cannot exceed 1000 characters"),
});

export const updateReviewSchema = z
  .object({
    rating: z.coerce
      .number()
      .int()
      .min(1, "Rating must be at least 1")
      .max(5, "Rating cannot exceed 5")
      .optional(),

    comment: z
      .string()
      .trim()
      .min(3, "Comment is too short")
      .max(1000, "Comment cannot exceed 1000 characters")
      .optional(),
  })
  .refine((data) => data.rating !== undefined || data.comment !== undefined, {
    message: "Provide rating or comment to update",
  });