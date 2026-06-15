import jwt from "jsonwebtoken";
import { config } from "../config.js";
import type { UserRole } from "@cinema-tix/shared";

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export function signAccess(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessTtl as jwt.SignOptions["expiresIn"],
  });
}

export function signRefresh(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshTtl as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAccess(token: string): JwtPayload {
  return jwt.verify(token, config.jwt.accessSecret) as JwtPayload;
}

export function verifyRefresh(token: string): JwtPayload {
  return jwt.verify(token, config.jwt.refreshSecret) as JwtPayload;
}
