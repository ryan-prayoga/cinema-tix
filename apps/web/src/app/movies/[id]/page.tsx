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

  const dates = useMemo(() => {
    const set = new Set(showtimes.map((s) => s.startsAt.slice(0, 10)));
    return [...set].sort();
  }, [showtimes]);

  const byCinema = useMemo(() => {
    const map = new Map<string, { name: string; city?: string; list: Showtime[] }>();
    for (const s of showtimes) {
      const key = s.cinema?.id ?? "?";
      if (!map.has(key))
        map.set(key, {
          name: s.cinema?.name ?? "Bioskop",
          city: s.cinema?.city,
          list: [],
        });
      map.get(key)!.list.push(s);
    }
    return [...map.values()];
  }, [showtimes]);

  if (!movie) return <p className="font-mono text-sm text-cream/40">Memuat...</p>;

  return (
    <div className="animate-fade-up">
      {/* Backdrop hero */}
      <section className="relative mb-10 overflow-hidden rounded-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={movie.posterUrl}
          alt=""
          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-30 blur-2xl"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/80 to-ink/40" />
        <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:p-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className="h-72 w-48 shrink-0 self-center rounded-xl object-cover shadow-2xl ring-1 ring-white/10 sm:self-start"
          />
          <div className="sm:pt-4">
            <span className="rounded bg-crimson px-2 py-0.5 font-mono text-[11px] tracking-wider text-white">
              {movie.rating}
            </span>
            <h1 className="mt-3 font-display text-5xl leading-none tracking-marquee text-cream">
              {movie.title}
            </h1>
            <p className="mt-2 font-mono text-xs uppercase tracking-widest text-gold">
              {movie.genres.join(" · ")} · {movie.durationMin} menit
            </p>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-cream/70">
              {movie.synopsis}
            </p>
          </div>
        </div>
      </section>

      <div className="mb-4 flex items-center gap-3">
        <h2 className="font-display text-3xl tracking-marquee text-cream">
          Jadwal
        </h2>
        <div className="deco-line flex-1" />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {["", ...dates].map((d) => (
          <button
            key={d || "all"}
            onClick={() => setDate(d)}
            className={`rounded-lg px-3.5 py-2 font-mono text-xs tracking-wide transition ${
              date === d
                ? "bg-gold text-ink shadow-goldglow"
                : "bg-white/5 text-cream/60 ring-1 ring-white/10 hover:text-cream"
            }`}
          >
            {d
              ? new Date(d)
                  .toLocaleDateString("id-ID", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })
                  .toUpperCase()
              : "SEMUA"}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {byCinema.map((c) => (
          <div key={c.name} className="card p-5">
            <div className="mb-3 flex items-baseline justify-between">
              <h3 className="font-display text-xl tracking-wide text-cream">
                {c.name}
              </h3>
              <span className="font-mono text-[11px] text-cream/40">
                {c.city}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {c.list.map((s) => (
                <button
                  key={s.id}
                  onClick={() => router.push(`/showtimes/${s.id}/seats`)}
                  className="group rounded-lg bg-black/30 px-3.5 py-2 ring-1 ring-white/10 transition hover:bg-crimson hover:ring-crimson"
                >
                  <span className="font-mono text-sm text-cream">
                    {formatTime(s.startsAt)}
                  </span>
                  <span className="ml-2 font-mono text-[10px] text-cream/40 group-hover:text-white/70">
                    {s.auditoriumName}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
        {byCinema.length === 0 && (
          <p className="font-mono text-sm text-cream/40">Belum ada jadwal.</p>
        )}
      </div>
    </div>
  );
}
