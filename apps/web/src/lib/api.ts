"use client";

import { useAuth } from "./auth-store";
import type { AuthResponse } from "@cinema-tix/shared";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function refreshTokens(): Promise<boolean> {
  const { refreshToken, setTokens, logout } = useAuth.getState();
  if (!refreshToken) return false;
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) {
    logout();
    return false;
  }
  const data = (await res.json()) as AuthResponse;
  setTokens(data.accessToken, data.refreshToken);
  return true;
}

export async function api<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const { auth, ...init } = options;

  const doFetch = async () => {
    const headers = new Headers(init.headers);
    headers.set("Content-Type", "application/json");
    if (auth) {
      const token = useAuth.getState().accessToken;
      if (token) headers.set("Authorization", `Bearer ${token}`);
    }
    return fetch(`${API_URL}${path}`, { ...init, headers });
  };

  let res = await doFetch();

  // On 401, try a single refresh then retry.
  if (res.status === 401 && auth) {
    if (await refreshTokens()) res = await doFetch();
  }

  if (!res.ok) {
    let message = res.statusText;
    try {
      message = (await res.json()).error ?? message;
    } catch {}
    throw new ApiError(res.status, message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
