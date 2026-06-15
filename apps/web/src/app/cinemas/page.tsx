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
    <div>
      <h1 className="mb-4 text-2xl font-bold">Bioskop</h1>
      <div className="grid gap-3 sm:grid-cols-2">
        {cinemas.map((c) => (
          <Link
            key={c.id}
            href={`/cinemas/${c.id}`}
            className="rounded-lg bg-panel p-4 ring-1 ring-white/5 hover:ring-accent"
          >
            <h3 className="font-semibold">{c.name}</h3>
            <p className="text-sm text-zinc-400">
              {c.city} · {c.address}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
