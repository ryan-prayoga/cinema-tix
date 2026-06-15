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

  const byMovie = useMemo(() => {
    const map = new Map<string, { title: string; poster?: string; list: Showtime[] }>();
    for (const s of showtimes) {
      const key = s.movie?.id ?? "?";
      if (!map.has(key))
        map.set(key, {
          title: s.movie?.title ?? "Film",
          poster: s.movie?.posterUrl,
          list: [],
        });
      map.get(key)!.list.push(s);
    }
    return [...map.values()];
  }, [showtimes]);

  if (!cinema) return <p className="font-mono text-sm text-cream/40">Memuat...</p>;

  return (
    <div className="animate-fade-up">
      <p className="font-mono text-[11px] uppercase tracking-widest text-gold">
        {cinema.city}
      </p>
      <h1 className="font-display text-4xl tracking-marquee text-cream">
        {cinema.name}
      </h1>
      <p className="mb-8 mt-1 text-sm text-cream/50">{cinema.address}</p>

      <div className="space-y-4">
        {byMovie.map((m) => (
          <div key={m.title} className="card flex gap-4 p-5">
            {m.poster && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={m.poster}
                alt=""
                className="hidden h-28 w-20 shrink-0 rounded-lg object-cover ring-1 ring-white/10 sm:block"
              />
            )}
            <div className="flex-1">
              <h3 className="mb-2 font-display text-xl tracking-wide text-cream">
                {m.title}
              </h3>
              <div className="flex flex-wrap gap-2">
                {m.list.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => router.push(`/showtimes/${s.id}/seats`)}
                    className="rounded-lg bg-black/30 px-3.5 py-2 font-mono text-sm text-cream ring-1 ring-white/10 transition hover:bg-crimson hover:ring-crimson"
                  >
                    {formatTime(s.startsAt)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
