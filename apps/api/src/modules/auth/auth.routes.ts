import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import { signAccess, signRefresh, verifyRefresh } from "../../lib/jwt.js";
import { asyncHandler, HttpError } from "../../middleware/error.js";
import { requireAuth, type AuthedRequest } from "../../middleware/auth.js";
import type { AuthResponse, AuthUser } from "@cinema-tix/shared";

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

function toAuthUser(u: {
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
}): AuthUser {
  return { id: u.id, email: u.email, name: u.name, role: u.role };
}

function issueTokens(user: AuthUser): AuthResponse {
  const payload = { sub: user.id, email: user.email, role: user.role };
  return {
    accessToken: signAccess(payload),
    refreshToken: signRefresh(payload),
    user,
  };
}

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { email, password, name } = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new HttpError(409, "Email already registered");
    const user = await prisma.user.create({
      data: { email, name, passwordHash: await hashPassword(password) },
    });
    res.status(201).json(issueTokens(toAuthUser(user)));
  })
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw new HttpError(401, "Invalid credentials");
    }
    res.json(issueTokens(toAuthUser(user)));
  })
);

authRouter.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const token = z.object({ refreshToken: z.string() }).parse(req.body)
      .refreshToken;
    let payload;
    try {
      payload = verifyRefresh(token);
    } catch {
      throw new HttpError(401, "Invalid refresh token");
    }
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new HttpError(401, "User not found");
    res.json(issueTokens(toAuthUser(user)));
  })
);

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.sub },
    });
    if (!user) throw new HttpError(404, "User not found");
    res.json(toAuthUser(user));
  })
);
