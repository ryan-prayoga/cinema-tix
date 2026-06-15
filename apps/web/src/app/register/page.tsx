"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import type { AuthResponse } from "@cinema-tix/shared";

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuth((s) => s.setAuth);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      setAuth(res);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Gagal daftar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto mt-8 max-w-sm animate-fade-up">
      <div className="card p-7">
        <h1 className="font-display text-4xl tracking-marquee text-cream">
          Daftar
        </h1>
        <p className="mb-6 mt-1 font-mono text-xs text-cream/40">
          Buat akun CINETIX
        </p>
        <form onSubmit={submit} className="space-y-3">
          <input
            className="input"
            placeholder="Nama"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
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
            placeholder="Password (min 8 karakter)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-sm text-crimson-glow">{error}</p>}
          <button disabled={busy} className="btn-primary w-full disabled:opacity-50">
            {busy ? "..." : "Daftar"}
          </button>
        </form>
        <p className="mt-5 text-sm text-cream/50">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-gold hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
