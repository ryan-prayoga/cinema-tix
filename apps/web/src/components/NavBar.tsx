"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-store";

export function NavBar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <header className="border-b border-white/10 bg-panel/60 backdrop-blur sticky top-0 z-20">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight">
          🎬 cinema<span className="text-accent">tix</span>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/cinemas" className="hover:text-accent">
            Bioskop
          </Link>
          {user ? (
            <>
              <Link href="/tickets" className="hover:text-accent">
                Tiket Saya
              </Link>
              <button
                onClick={() => {
                  logout();
                  router.push("/");
                }}
                className="text-zinc-400 hover:text-accent"
              >
                Keluar ({user.name.split(" ")[0]})
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded bg-accent px-3 py-1.5 font-medium"
            >
              Masuk
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
