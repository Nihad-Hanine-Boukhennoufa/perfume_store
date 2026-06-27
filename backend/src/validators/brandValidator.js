import { z } from "zod";

export const createBrandSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Brand name is too short")
    .max(50),
});gk