"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { formatTime } from "@/lib/format";
import type { Movie, Showtime } from "@cinema-tix/shared";

export default function MovieDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [date, setDate] = useState<string>("");

  useEffect(() => {
    api<Movie>(`/movies/${id}`).then(setMovie);
  }, [id]);

  useEffect(() => {
    const q = new URLSearchParams({ movieId: id });
    if (date) q.set("date", date);
    api<Showtime[]>(`/showtimes?${q}`).then(setShowtimes);
  }, [id, date]);

  // Available dates from showtimes (first load with no date filter).
  const dates = useMemo(() => {
    const set = new Set(showtimes.map((s) => s.startsAt.slice(0, 10)));
    return [...set].sort();
  }, [showtimes]);

  // Group by cinema.
  const byCinema = useMemo(() => {
    const map = new Map<string, { name: string; list: Showtime[] }>();
    for (const s of showtimes) {
      const key = s.cinema?.id ?? "?";
      if (!map.has(key))
        map.set(key, { name: s.cinema?.name ?? "Bioskop", list: [] });
      map.get(key)!.list.push(s);
    }
    return [...map.values()];
  }, [showtimes]);

  if (!movie) return <p className="text-zinc-400">Memuat...</p>;

  return (
    <div>
      <div className="flex gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="h-48 w-32 shrink-0 rounded object-cover"
        />
        <div>
          <h1 className="text-2xl font-bold">{movie.title}</h1>
          <p className="mt-1 text-xs text-zinc-400">
            {movie.rating} · {movie.genres.join(", ")} · {movie.durationMin}m
          </p>
          <p className="mt-2 text-sm text-zinc-300">{movie.synopsis}</p>
        </div>
      </div>

      <h2 className="mb-3 mt-8 text-lg font-semibold">Jadwal</h2>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setDate("")}
          className={`rounded px-3 py-1 text-sm ring-1 ring-white/10 ${
            date === "" ? "bg-accent" : "bg-panel"
          }`}
        >
          Semua
        </button>
        {dates.map((d) => (
          <button
            key={d}
            onClick={() => setDate(d)}
            className={`rounded px-3 py-1 text-sm ring-1 ring-white/10 ${
              date === d ? "bg-accent" : "bg-panel"
            }`}
          >
            {new Date(d).toLocaleDateString("id-ID", {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {byCinema.map((c) => (
          <div key={c.name} className="rounded-lg bg-panel p-4 ring-1 ring-white/5">
            <h3 className="mb-2 font-semibold">{c.name}</h3>
            <div className="flex flex-wrap gap-2">
              {c.list.map((s) => (
                <button
                  key={s.id}
                  onClick={() => router.push(`/showtimes/${s.id}/seats`)}
                  className="rounded bg-ink px-3 py-1.5 text-sm ring-1 ring-white/10 hover:ring-accent"
                >
                  {formatTime(s.startsAt)}
                  <span className="ml-1 text-xs text-zinc-500">
                    {s.auditoriumName}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
        {byCinema.length === 0 && (
          <p className="text-sm text-zinc-400">Belum ada jadwal.</p>
        )}
      </div>
    </div>
  );
}
