import { z } from "zod";

export const updateMeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name is too long")
    .optional(),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid email address")
    .optional(),
}).refine(
  // image is handled by multer — at least one text field OR a file must be present.
  // We can only check text fields here; file presence is checked in the controller.
  (data) => data.name !== undefined || data.email !== undefined,
  { message: "At least one field must be provided" }
);

export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, "Current password is required"),

  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .max(72, "Password is too long"),
}).refine(
  (data) => data.currentPassword !== data.newPassword,
  {
    message: "New password must be different from current password",
    path: ["newPassword"],
  }
);

export const updateUserRoleSchema = z.object({
  role: z.enum(["user", "admin"], {
    errorMap: () => ({ message: "Role must be 'user' or 'admin'" }),
  }),
});