"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { rupiah, formatDateTime } from "@/lib/format";
import type { BookingDTO } from "@cinema-tix/shared";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Menunggu bayar",
  PAID: "Lunas",
  CANCELLED: "Dibatalkan",
  EXPIRED: "Kadaluarsa",
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
    <div>
      <h1 className="mb-4 text-2xl font-bold">Tiket Saya</h1>
      <div className="space-y-3">
        {bookings.map((b) => (
          <div
            key={b.id}
            className="rounded-lg bg-panel p-4 ring-1 ring-white/5"
            onClick={() =>
              b.status === "PENDING" && router.push(`/checkout/${b.id}`)
            }
          >
            <div className="flex justify-between">
              <h3 className="font-semibold">{b.showtime?.movie?.title}</h3>
              <span
                className={`text-xs ${
                  b.status === "PAID"
                    ? "text-emerald-400"
                    : b.status === "PENDING"
                      ? "text-yellow-400"
                      : "text-zinc-500"
                }`}
              >
                {STATUS_LABEL[b.status]}
              </span>
            </div>
            <p className="text-sm text-zinc-400">
              {b.showtime?.cinema?.name} ·{" "}
              {b.showtime && formatDateTime(b.showtime.startsAt)}
            </p>
            <p className="text-sm">
              Kursi:{" "}
              {b.seats.map((s) => `${s.rowLabel}${s.colNumber}`).join(", ")}
            </p>
            <p className="mt-1 font-bold">{rupiah(b.totalPrice)}</p>
          </div>
        ))}
        {bookings.length === 0 && (
          <p className="text-sm text-zinc-400">Belum ada tiket.</p>
        )}
      </div>
    </div>
  );
}
