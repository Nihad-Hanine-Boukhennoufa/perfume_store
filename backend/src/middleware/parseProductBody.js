/**
 * Parses multipart/form-data fields that were JSON-stringified on the client.
 * Replaces both parseProductBody.js and parseProductFormData.js.
 *
 * Fields handled:
 *   variants   → array
 *   notes      → { top[], heart[], base[] }
 *   scentType  → array
 *   season     → array
 *   isFeatured → boolean
 *   isPublished→ boolean
 */
export const parseProductBody = (req, res, next) => {
  // ─────────────────────────────
  // Helper: parse a JSON string into the expected type.
  // Returns null if the value is missing/null.
  // Returns the value as-is if it's already the right type.
  // Throws if the string is present but not valid JSON.
  // ─────────────────────────────
  const parseJSON = (value) => {
    if (value == null) return null;
    if (typeof value !== "string") return value;
    return JSON.parse(value); // intentionally throws on bad JSON
  };

  // ─────────────────────────────
  // Helper: coerce "true"/"false" strings → boolean
  // ─────────────────────────────
  const parseBool = (value) => {
    if (value == null) return undefined;
    if (typeof value === "boolean") return value;
    if (value === "true") return true;
    if (value === "false") return false;
    return undefined;
  };

  try {
    // ── JSON fields ───────────────────────────────────────────

    const variants = parseJSON(req.body.variants);
    if (variants !== null) {
      if (!Array.isArray(variants)) {
        return res.status(400).json({
          success: false,
          message: "variants must be a JSON array",
        });
      }
      req.body.variants = variants;
    }

    const notes = parseJSON(req.body.notes);
    if (notes !== null) {
      if (typeof notes !== "object" || Array.isArray(notes)) {
        return res.status(400).json({
          success: false,
          message: "notes must be a JSON object with top, heart, and base arrays",
        });
      }
      // Normalise missing levels to empty arrays
      req.body.notes = {
        top: Array.isArray(notes.top) ? notes.top : [],
        heart: Array.isArray(notes.heart) ? notes.heart : [],
        base: Array.isArray(notes.base) ? notes.base : [],
      };
    }

    const scentType = parseJSON(req.body.scentType);
    if (scentType !== null) {
      if (!Array.isArray(scentType)) {
        return res.status(400).json({
          success: false,
          message: "scentType must be a JSON array",
        });
      }
      req.body.scentType = scentType;
    }

    const season = parseJSON(req.body.season);
    if (season !== null) {
      if (!Array.isArray(season)) {
        return res.status(400).json({
          success: false,
          message: "season must be a JSON array",
        });
      }
      req.body.season = season;
    }

    // ── Boolean fields (sent as strings from FormData) ────────

    const isFeatured = parseBool(req.body.isFeatured);
    if (isFeatured !== undefined) req.body.isFeatured = isFeatured;

    const isPublished = parseBool(req.body.isPublished);
    if (isPublished !== undefined) req.body.isPublished = isPublished;

    next();
  } catch {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON in request body",
    });
  }
};