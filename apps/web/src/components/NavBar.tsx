"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-store";

export function NavBar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-ink/70 pt-safe backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-5 sm:py-4">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-crimson text-base shadow-glow">
            🎟
          </span>
          <span className="font-display text-2xl tracking-marquee text-cream">
            CINE<span className="text-gold">TIX</span>
          </span>
        </Link>

        <div className="flex items-center gap-5 text-sm">
          {/* Desktop nav links — on mobile the bottom tab bar handles these */}
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
                className="hidden text-cream/70 transition hover:text-gold sm:block"
              >
                Tiket Saya
              </Link>
              <button
                onClick={() => {
                  logout();
                  router.push("/");
                }}
                className="hidden rounded-lg px-3 py-1.5 text-cream/50 ring-1 ring-white/10 transition hover:text-crimson-glow sm:block"
              >
                {user.name.split(" ")[0]} · Keluar
              </button>
              <span className="font-mono text-xs text-gold sm:hidden">
                {user.name.split(" ")[0]}
              </span>
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
