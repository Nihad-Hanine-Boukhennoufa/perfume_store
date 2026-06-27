export const parseProductFormData = (req, res, next) => {

  const parse = (value, fallback) => {
    if (value == null) return fallback;

    if (typeof value !== "string") {
      return value;
    }

    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  };

  req.body.variants = parse(req.body.variants, []);

  req.body.notes = parse(req.body.notes, {
    top: [],
    heart: [],
    base: [],
  });

  req.body.scentType = parse(req.body.scentType, []);

  req.body.season = parse(req.body.season, []);

  next();
};