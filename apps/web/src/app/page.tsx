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
      <h1 className="mb-1 text-2xl font-bold">Sedang Tayang</h1>
      <p className="mb-6 text-sm text-zinc-400">
        Pilih film, kursi, dan lihat POV 3D sebelum pesan.
      </p>

      {loading ? (
        <p className="text-zinc-400">Memuat...</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {movies.map((m) => (
            <Link
              key={m.id}
              href={`/movies/${m.id}`}
              className="group overflow-hidden rounded-lg bg-panel ring-1 ring-white/5"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.posterUrl}
                alt={m.title}
                className="aspect-[2/3] w-full object-cover transition group-hover:opacity-80"
              />
              <div className="p-3">
                <h3 className="truncate font-semibold">{m.title}</h3>
                <p className="text-xs text-zinc-400">
                  {m.genres.join(" • ")} · {m.durationMin}m
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
