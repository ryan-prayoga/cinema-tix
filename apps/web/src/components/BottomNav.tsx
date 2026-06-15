"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-store";

const TABS = [
  { href: "/", label: "Beranda", icon: "🎬" },
  { href: "/cinemas", label: "Bioskop", icon: "📍" },
  { href: "/tickets", label: "Tiket", icon: "🎟" },
  { href: "/akun", label: "Akun", icon: "👤" },
];

// Native-style bottom tab bar — mobile only (hidden on >= sm).
export function BottomNav() {
  const path = usePathname();
  const user = useAuth((s) => s.user);

  const isActive = (href: string) =>
    href === "/" ? path === "/" : path.startsWith(href);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink/85 pb-safe backdrop-blur-xl sm:hidden">
      <div className="mx-auto grid max-w-md grid-cols-4">
        {TABS.map((t) => {
          const href = t.href === "/akun" && !user ? "/login" : t.href;
          const active = isActive(t.href);
          return (
            <Link
              key={t.href}
              href={href}
              className={`flex flex-col items-center gap-1 py-2.5 transition active:scale-95 ${
                active ? "text-gold" : "text-cream/45"
              }`}
            >
              <span className={`text-lg ${active ? "scale-110" : ""} transition`}>
                {t.icon}
              </span>
              <span className="font-mono text-[10px] tracking-wide">
                {t.label}
              </span>
              <span
                className={`h-0.5 w-6 rounded-full transition ${
                  active ? "bg-gold" : "bg-transparent"
                }`}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
