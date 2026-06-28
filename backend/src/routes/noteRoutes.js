import express from "express";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware.js";
import { uploadNote } from "../middleware/upload.js";
import { validate } from "../middleware/validate.js";
import { createNoteSchema, updateNoteSchema } from "../validators/noteValidator.js";
import {
  createNote,
  getAllNotes,
  getNoteById,
  updateNote,
  deleteNote,
} from "../controllers/noteController.js";

const router = express.Router();

// Public
router.get("/", getAllNotes);
router.get("/:id", getNoteById);

// Admin
router.use(verifyToken, verifyAdmin);
router.post("/", uploadNote.single("image"), validate(createNoteSchema), createNote);
router.put("/:id", uploadNote.single("image"), validate(updateNoteSchema), updateNote);
router.delete("/:id", deleteNote);

export default router;