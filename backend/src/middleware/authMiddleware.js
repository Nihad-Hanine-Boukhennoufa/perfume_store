import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  
  const authHeader = req.headers.authorization;
  const token = authHeader.split(" ")[1]; // Bearer <token>

  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res.status(401).json({ message: "Access denied" });


  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // id + isAdmin
    next();
  } catch (error) {
  if (error.name === "TokenExpiredError") {
    return res.status(401).json({ message: "Token expired" });
  } else {
    return res.status(401).json({ message: "Invalid token" });
  }
};
}

// Middleware to check admin privileges
export const verifyAdmin = (req, res, next) => {

  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  next();
};
