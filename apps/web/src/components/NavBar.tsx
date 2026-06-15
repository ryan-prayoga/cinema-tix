"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-store";

export function NavBar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-ink/70 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-crimson text-base shadow-glow">
            🎟
          </span>
          <span className="font-display text-2xl tracking-marquee text-cream">
            CINE<span className="text-gold">TIX</span>
          </span>
        </Link>

        <div className="flex items-center gap-5 text-sm">
          <Link
            href="/cinemas"
            className="hidden text-cream/70 transition hover:text-gold sm:block"
          >
            Bioskop
          </Link>
          {user ? (
            <>
              <Link
                href="/tickets"
                className="text-cream/70 transition hover:text-gold"
              >
                Tiket Saya
              </Link>
              <button
                onClick={() => {
                  logout();
                  router.push("/");
                }}
                className="rounded-lg px-3 py-1.5 text-cream/50 ring-1 ring-white/10 transition hover:text-crimson-glow"
              >
                {user.name.split(" ")[0]} · Keluar
              </button>
            </>
          ) : (
            <Link href="/login" className="btn-primary text-sm">
              Masuk
            </Link>
          )}
        </div>
      </nav>
      <div className="deco-line" />
    </header>
  );
}
