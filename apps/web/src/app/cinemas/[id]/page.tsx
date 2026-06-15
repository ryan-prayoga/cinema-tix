"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { formatTime } from "@/lib/format";
import type { Cinema, Showtime } from "@cinema-tix/shared";

export default function CinemaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [cinema, setCinema] = useState<Cinema | null>(null);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);

  useEffect(() => {
    api<Cinema>(`/cinemas/${id}`).then(setCinema);
    api<Showtime[]>(`/showtimes?cinemaId=${id}`).then(setShowtimes);
  }, [id]);

  // Group by movie.
  const byMovie = useMemo(() => {
    const map = new Map<string, { title: string; list: Showtime[] }>();
    for (const s of showtimes) {
      const key = s.movie?.id ?? "?";
      if (!map.has(key))
        map.set(key, { title: s.movie?.title ?? "Film", list: [] });
      map.get(key)!.list.push(s);
    }
    return [...map.values()];
  }, [showtimes]);

  if (!cinema) return <p className="text-zinc-400">Memuat...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold">{cinema.name}</h1>
      <p className="mb-6 text-sm text-zinc-400">
        {cinema.city} · {cinema.address}
      </p>

      <div className="space-y-4">
        {byMovie.map((m) => (
          <div key={m.title} className="rounded-lg bg-panel p-4 ring-1 ring-white/5">
            <h3 className="mb-2 font-semibold">{m.title}</h3>
            <div className="flex flex-wrap gap-2">
              {m.list.map((s) => (
                <button
                  key={s.id}
                  onClick={() => router.push(`/showtimes/${s.id}/seats`)}
                  className="rounded bg-ink px-3 py-1.5 text-sm ring-1 ring-white/10 hover:ring-accent"
                >
                  {formatTime(s.startsAt)}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
