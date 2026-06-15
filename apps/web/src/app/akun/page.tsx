"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-store";

export default function AkunPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!user) router.replace("/login?next=/akun");
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="animate-fade-up">
      <div className="mb-6 flex items-center gap-3">
        <h1 className="font-display text-4xl tracking-marquee text-cream">Akun</h1>
        <div className="deco-line flex-1" />
      </div>

      <div className="card flex items-center gap-4 p-5">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-crimson font-display text-2xl text-white shadow-glow">
          {user.name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-2xl tracking-wide text-cream">
            {user.name}
          </p>
          <p className="truncate font-mono text-xs text-cream/50">{user.email}</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <Link
          href="/tickets"
          className="card flex items-center justify-between p-4 active:scale-[0.99]"
        >
          <span className="flex items-center gap-3 text-cream">🎟 Tiket Saya</span>
          <span className="text-cream/30">›</span>
        </Link>
        <Link
          href="/cinemas"
          className="card flex items-center justify-between p-4 active:scale-[0.99]"
        >
          <span className="flex items-center gap-3 text-cream">📍 Bioskop</span>
          <span className="text-cream/30">›</span>
        </Link>
      </div>

      <button
        onClick={() => {
          logout();
          router.push("/");
        }}
        className="mt-6 w-full rounded-lg bg-white/5 py-3 font-medium text-crimson-glow ring-1 ring-white/10 active:scale-[0.99]"
      >
        Keluar
      </button>

      <p className="mt-6 text-center font-mono text-[11px] text-cream/30">
        CINETIX · pasang ke layar utama untuk pengalaman penuh
      </p>
    </div>
  );
}
