import type { Request, Response, NextFunction } from "express";
import { verifyAccess, type JwtPayload } from "../lib/jwt.js";

export interface AuthedRequest extends Request {
  user?: JwtPayload;
}

export function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing token" });
  }
  try {
    req.user = verifyAccess(header.slice(7));
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}
