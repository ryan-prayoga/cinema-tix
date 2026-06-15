"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import type { AuthResponse } from "@cinema-tix/shared";

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-zinc-400">Memuat...</p>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const setAuth = useAuth((s) => s.setAuth);
  const [email, setEmail] = useState("demo@cinema.test");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setAuth(res);
      router.push(params.get("next") || "/");
    } catch (err: any) {
      setError(err.message || "Gagal masuk");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-4 text-2xl font-bold">Masuk</h1>
      <form onSubmit={submit} className="space-y-3">
        <input
          className="w-full rounded bg-panel px-3 py-2 ring-1 ring-white/10"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full rounded bg-panel px-3 py-2 ring-1 ring-white/10"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-accent">{error}</p>}
        <button
          disabled={busy}
          className="w-full rounded bg-accent py-2 font-medium disabled:opacity-50"
        >
          {busy ? "..." : "Masuk"}
        </button>
      </form>
      <p className="mt-4 text-sm text-zinc-400">
        Belum punya akun?{" "}
        <Link href="/register" className="text-accent">
          Daftar
        </Link>
      </p>
    </div>
  );
}
