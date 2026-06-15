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
    <div className="mx-auto max-w-sm">
      <h1 className="mb-4 text-2xl font-bold">Daftar</h1>
      <form onSubmit={submit} className="space-y-3">
        <input
          className="w-full rounded bg-panel px-3 py-2 ring-1 ring-white/10"
          placeholder="Nama"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
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
          placeholder="Password (min 8 karakter)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-accent">{error}</p>}
        <button
          disabled={busy}
          className="w-full rounded bg-accent py-2 font-medium disabled:opacity-50"
        >
          {busy ? "..." : "Daftar"}
        </button>
      </form>
      <p className="mt-4 text-sm text-zinc-400">
        Sudah punya akun?{" "}
        <Link href="/login" className="text-accent">
          Masuk
        </Link>
      </p>
    </div>
  );
}
