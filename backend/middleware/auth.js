import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";

/**
 * Verifies JWT from Authorization header and attaches user to req.
 * Does not block if no token - use requireAuth for protected routes.
 */
export async function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    req.user = null;
    return next();
  }
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { profile: true },
    });
    req.user = user;
  } catch {
    req.user = null;
  }
  next();
}

/**
 * Requires authentication. Returns 401 if not authenticated.
 */
export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}
