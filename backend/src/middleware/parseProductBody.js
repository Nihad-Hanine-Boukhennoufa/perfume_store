export const parseProductBody = (req, res, next) => {
  try {
    if (req.body.variants) {
      req.body.variants = JSON.parse(req.body.variants);
    }

    if (req.body.notes) {
      req.body.notes = JSON.parse(req.body.notes);
    }

    if (req.body.scentType) {
      req.body.scentType = JSON.parse(req.body.scentType);
    }

    if (req.body.season) {
      req.body.season = JSON.parse(req.body.season);
    }

    next();
  } catch {
    return res.status(400).json({
      success: false,
      message: "Invalid request format",
    });
  }
};