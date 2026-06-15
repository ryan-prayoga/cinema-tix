"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Movie } from "@cinema-tix/shared";

export default function HomePage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Movie[]>("/movies?status=NOW_SHOWING")
      .then(setMovies)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative mb-12 overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-panel via-char to-ink px-7 py-12 sm:px-10 sm:py-16">
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-crimson/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-gold/10 blur-3xl" />
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.35em] text-gold">
          Now Showing · 2026
        </p>
        <h1 className="max-w-2xl font-display text-5xl leading-[0.95] tracking-marquee text-cream sm:text-7xl">
          Pilih kursi.<br />
          <span className="text-crimson-glow">Lihat povnya.</span> Pesan.
        </h1>
        <p className="mt-5 max-w-md text-sm text-cream/60">
          Booking tiket bioskop dengan denah kursi real-time dan pratinjau 3D
          dari posisi duduk kamu — sebelum bayar.
        </p>
      </section>

      <div className="mb-5 flex items-end justify-between">
        <h2 className="font-display text-3xl tracking-marquee text-cream">
          Sedang Tayang
        </h2>
        <Link
          href="/cinemas"
          className="font-mono text-xs uppercase tracking-widest text-cream/50 hover:text-gold"
        >
          Semua bioskop →
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[2/3] animate-pulse rounded-xl bg-panel/60"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {movies.map((m, i) => (
            <Link
              key={m.id}
              href={`/movies/${m.id}`}
              style={{ animationDelay: `${i * 70}ms` }}
              className="group relative animate-fade-up overflow-hidden rounded-xl ring-1 ring-white/5 transition hover:ring-gold/40"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.posterUrl}
                alt={m.title}
                className="aspect-[2/3] w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent opacity-90" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <span className="mb-1 inline-block rounded bg-crimson/90 px-1.5 py-0.5 font-mono text-[10px] tracking-wider text-white">
                  {m.rating}
                </span>
                <h3 className="font-display text-xl leading-tight tracking-wide text-cream">
                  {m.title}
                </h3>
                <p className="mt-0.5 font-mono text-[11px] text-cream/50">
                  {m.genres.slice(0, 2).join(" · ")} · {m.durationMin}m
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
