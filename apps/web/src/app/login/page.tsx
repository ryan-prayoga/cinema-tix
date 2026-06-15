"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import type { AuthResponse } from "@cinema-tix/shared";

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="font-mono text-sm text-cream/40">Memuat...</p>}>
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
    <div className="mx-auto mt-8 max-w-sm animate-fade-up">
      <div className="card p-7">
        <h1 className="font-display text-4xl tracking-marquee text-cream">
          Masuk
        </h1>
        <p className="mb-6 mt-1 font-mono text-xs text-cream/40">
          Lanjut pesan kursimu
        </p>
        <form onSubmit={submit} className="space-y-3">
          <input
            className="input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-sm text-crimson-glow">{error}</p>}
          <button disabled={busy} className="btn-primary w-full disabled:opacity-50">
            {busy ? "..." : "Masuk"}
          </button>
        </form>
        <p className="mt-5 text-sm text-cream/50">
          Belum punya akun?{" "}
          <Link href="/register" className="text-gold hover:underline">
            Daftar
          </Link>
        </p>
      </div>
    </div>
  );
}
