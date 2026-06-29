/**
 * Parses multipart/form-data fields that were JSON-stringified on the client.
 *
 * Fields handled:
 *   variants     → array
 *   notes        → { top[], heart[], base[] }
 *   scentType    → array
 *   season       → array
 *   isFeatured   → boolean
 *   isPublished  → boolean
 *   replaceImages→ boolean  ✅ FIX 5: was not parsed before
 *   removeImages → string[] ✅ FIX 5: normalised to array
 */
export const parseProductBody = (req, res, next) => {
  const parseJSON = (value) => {
    if (value == null) return null;
    if (typeof value !== "string") return value;
    return JSON.parse(value);
  };

  const parseBool = (value) => {
    if (value == null)            return undefined;
    if (typeof value === "boolean") return value;
    if (value === "true")         return true;
    if (value === "false")        return false;
    return undefined;
  };

  try {
    // ── JSON arrays / objects ─────────────────────────────────────────────────

    const variants = parseJSON(req.body.variants);
    if (variants !== null) {
      if (!Array.isArray(variants)) {
        return res.status(400).json({ success: false, message: "variants must be a JSON array" });
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
      req.body.notes = {
        top:   Array.isArray(notes.top)   ? notes.top   : [],
        heart: Array.isArray(notes.heart) ? notes.heart : [],
        base:  Array.isArray(notes.base)  ? notes.base  : [],
      };
    }

    const scentType = parseJSON(req.body.scentType);
    if (scentType !== null) {
      if (!Array.isArray(scentType)) {
        return res.status(400).json({ success: false, message: "scentType must be a JSON array" });
      }
      req.body.scentType = scentType;
    }

    const season = parseJSON(req.body.season);
    if (season !== null) {
      if (!Array.isArray(season)) {
        return res.status(400).json({ success: false, message: "season must be a JSON array" });
      }
      req.body.season = season;
    }

    // ── Boolean fields ────────────────────────────────────────────────────────

    const isFeatured = parseBool(req.body.isFeatured);
    if (isFeatured !== undefined) req.body.isFeatured = isFeatured;

    const isPublished = parseBool(req.body.isPublished);
    if (isPublished !== undefined) req.body.isPublished = isPublished;

    // ✅ FIX 5a: replaceImages comes as "true"/"false" string from FormData
    const replaceImages = parseBool(req.body.replaceImages);
    if (replaceImages !== undefined) req.body.replaceImages = replaceImages;

    // ✅ FIX 5b: removeImages may arrive as a single string or array of strings
    //            normalise to always be string[]
    if (req.body.removeImages !== undefined) {
      if (typeof req.body.removeImages === "string") {
        req.body.removeImages = [req.body.removeImages];
      } else if (!Array.isArray(req.body.removeImages)) {
        req.body.removeImages = [];
      }
    }

    next();
  } catch {
    return res.status(400).json({ success: false, message: "Invalid JSON in request body" });
  }
};