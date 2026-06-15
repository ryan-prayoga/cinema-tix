"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Cinema } from "@cinema-tix/shared";

export default function CinemasPage() {
  const [cinemas, setCinemas] = useState<Cinema[]>([]);

  useEffect(() => {
    api<Cinema[]>("/cinemas").then(setCinemas);
  }, []);

  return (
    <div className="animate-fade-up">
      <div className="mb-6 flex items-center gap-3">
        <h1 className="font-display text-4xl tracking-marquee text-cream">
          Bioskop
        </h1>
        <div className="deco-line flex-1" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {cinemas.map((c) => (
          <Link
            key={c.id}
            href={`/cinemas/${c.id}`}
            className="card group p-5 transition hover:ring-gold/40"
          >
            <p className="font-mono text-[11px] uppercase tracking-widest text-gold">
              {c.city}
            </p>
            <h3 className="mt-1 font-display text-2xl tracking-wide text-cream">
              {c.name}
            </h3>
            <p className="mt-1 text-sm text-cream/50">{c.address}</p>
            <span className="mt-3 inline-block font-mono text-xs text-cream/40 group-hover:text-gold">
              Lihat jadwal →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
