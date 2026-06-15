"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "./BottomNav";

// Deep flows (seat picker, checkout) go full-screen — no bottom tab bar.
function hidesNav(path: string) {
  return (
    path.includes("/seats") ||
    path.startsWith("/checkout") ||
    path === "/login" ||
    path === "/register"
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const hide = hidesNav(path);

  return (
    <>
      <main
        className={`relative z-10 mx-auto max-w-6xl px-4 py-6 sm:px-5 sm:py-8 ${
          hide ? "" : "pb-nav sm:pb-8"
        }`}
      >
        {children}
      </main>
      {!hide && <BottomNav />}
    </>
  );
}
