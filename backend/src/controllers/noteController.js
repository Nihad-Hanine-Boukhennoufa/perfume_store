import Note from "../models/Note.js";
import Product from "../models/Product.js"; // ✅ FIX: was missing — deleteNote uses Product.exists()
import { deleteCloudinaryImage } from "../utils/cloudinaryHelper.js";

// ─── Create note ──────────────────────────────────────────────────────────────

export const createNote = async (req, res, next) => {
  try {
    const { name, family } = req.body;

    if (!name || !family) {
      if (req.file) await deleteCloudinaryImage(req.file.filename);

      return res.status(400).json({
        success: false,
        message: "Name and family are required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Note image is required",
      });
    }

    const exists = await Note.findOne({
      name: { $regex: `^${name.trim()}$`, $options: "i" },
    });

    if (exists) {
      await deleteCloudinaryImage(req.file.filename);

      return res.status(409).json({
        success: false,
        message: "Note already exists",
      });
    }

    const note = await Note.create({
      name: name.trim(),
      family,
      image: req.file.path,
      imagePublicId: req.file.filename,
    });

    res.status(201).json({
      success: true,
      data: note,
      message: "Note created successfully",
    });
  } catch (err) {
    if (req.file) await deleteCloudinaryImage(req.file.filename);
    next(err);
  }
};

// ─── Get all notes ────────────────────────────────────────────────────────────

export const getAllNotes = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = "", family = "" } = req.query;

    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 100);

    const query = {};

    if (search) {
      query.name = { $regex: search.trim(), $options: "i" };
    }

    if (family) {
      query.family = family;
    }

    const [notes, total] = await Promise.all([
      Note.find(query)
        .sort({ name: 1 })
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber),

      Note.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: notes,
      total,
      totalPages: Math.ceil(total / limitNumber),
      currentPage: pageNumber,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Get note by ID ───────────────────────────────────────────────────────────

export const getNoteById = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    res.status(200).json({
      success: true,
      data: note,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Update note ──────────────────────────────────────────────────────────────

export const updateNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      if (req.file) await deleteCloudinaryImage(req.file.filename);

      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    const { name, family } = req.body;

    if (name && name.trim() !== note.name) {
      const exists = await Note.findOne({
        _id: { $ne: note._id },
        name: { $regex: `^${name.trim()}$`, $options: "i" },
      });

      if (exists) {
        if (req.file) await deleteCloudinaryImage(req.file.filename);

        return res.status(409).json({
          success: false,
          message: "Note already exists",
        });
      }

      note.name = name.trim();
    }

    if (family) note.family = family;

    if (req.file) {
      if (note.imagePublicId) await deleteCloudinaryImage(note.imagePublicId);
      note.image = req.file.path;
      note.imagePublicId = req.file.filename;
    }

    await note.save();

    res.status(200).json({
      success: true,
      data: note,
      message: "Note updated successfully",
    });
  } catch (err) {
    if (req.file) await deleteCloudinaryImage(req.file.filename);
    next(err);
  }
};

// ─── Delete note ──────────────────────────────────────────────────────────────

export const deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    const used = await Product.exists({
      $or: [
        { "notes.top": note._id },
        { "notes.heart": note._id },
        { "notes.base": note._id },
      ],
    });

    if (used) {
      return res.status(409).json({
        success: false,
        message: "Cannot delete a note that is used by products",
      });
    }

    if (note.imagePublicId) await deleteCloudinaryImage(note.imagePublicId);

    await note.deleteOne();

    res.status(200).json({
      success: true,
      message: "Note deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};