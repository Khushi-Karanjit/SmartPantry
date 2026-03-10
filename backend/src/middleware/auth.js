const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Authorization header missing" });
  }

  const [type, token] = authHeader.split(" ");

  if (type !== "Bearer" || !token) {
    return res.status(401).json({ message: "Invalid Authorization format" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Single source of truth
    req.userId = payload.sub;
    req.userRole = payload.role || "user";

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

function requireRole(role) {
  return function requireRoleMiddleware(req, res, next) {
    if (!req.userRole) return res.status(401).json({ message: "Unauthorized" });
    if (req.userRole !== role) return res.status(403).json({ message: "Forbidden" });
    return next();
  };
}

module.exports = { requireAuth, requireRole };
