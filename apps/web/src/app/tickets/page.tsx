"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { rupiah, formatDateTime } from "@/lib/format";
import type { BookingDTO } from "@cinema-tix/shared";

const STATUS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Menunggu bayar", cls: "text-gold" },
  PAID: { label: "Lunas", cls: "text-emerald-400" },
  CANCELLED: { label: "Dibatalkan", cls: "text-cream/40" },
  EXPIRED: { label: "Kadaluarsa", cls: "text-cream/40" },
};

export default function TicketsPage() {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const [bookings, setBookings] = useState<BookingDTO[]>([]);

  useEffect(() => {
    if (!user) {
      router.replace("/login?next=/tickets");
      return;
    }
    api<BookingDTO[]>("/bookings/me", { auth: true }).then(setBookings);
  }, [user, router]);

  return (
    <div className="animate-fade-up">
      <div className="mb-6 flex items-center gap-3">
        <h1 className="font-display text-4xl tracking-marquee text-cream">
          Tiket Saya
        </h1>
        <div className="deco-line flex-1" />
      </div>

      <div className="space-y-3">
        {bookings.map((b) => {
          const st = STATUS[b.status];
          return (
            <button
              key={b.id}
              onClick={() =>
                b.status === "PENDING" && router.push(`/checkout/${b.id}`)
              }
              className="card flex w-full items-center gap-4 p-5 text-left transition hover:ring-gold/30"
            >
              {b.showtime?.movie?.posterUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={b.showtime.movie.posterUrl}
                  alt=""
                  className="h-20 w-14 shrink-0 rounded-lg object-cover ring-1 ring-white/10"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate font-display text-xl tracking-wide text-cream">
                    {b.showtime?.movie?.title}
                  </h3>
                  <span className={`shrink-0 font-mono text-[11px] ${st.cls}`}>
                    {st.label}
                  </span>
                </div>
                <p className="font-mono text-[11px] text-cream/50">
                  {b.showtime?.cinema?.name} ·{" "}
                  {b.showtime && formatDateTime(b.showtime.startsAt)}
                </p>
                <p className="mt-0.5 font-mono text-xs text-cream/70">
                  {b.seats.map((s) => `${s.rowLabel}${s.colNumber}`).join(" · ")}
                </p>
              </div>
              <span className="shrink-0 self-end font-display text-xl tracking-wide text-gold">
                {rupiah(b.totalPrice)}
              </span>
            </button>
          );
        })}
        {bookings.length === 0 && (
          <p className="font-mono text-sm text-cream/40">Belum ada tiket.</p>
        )}
      </div>
    </div>
  );
}
