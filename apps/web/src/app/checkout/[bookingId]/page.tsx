"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { rupiah, formatDateTime } from "@/lib/format";
import type { BookingDTO } from "@cinema-tix/shared";

export default function CheckoutPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<BookingDTO | null>(null);
  const [left, setLeft] = useState<number>(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<BookingDTO>(`/bookings/${bookingId}`, { auth: true }).then(setBooking);
  }, [bookingId]);

  // Countdown to hold expiry.
  useEffect(() => {
    if (!booking?.expiresAt) return;
    const tick = () => {
      const ms = new Date(booking.expiresAt!).getTime() - Date.now();
      setLeft(Math.max(0, Math.floor(ms / 1000)));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [booking]);

  async function pay() {
    setBusy(true);
    try {
      await api<BookingDTO>(`/bookings/${bookingId}/confirm`, {
        method: "POST",
        auth: true,
      });
      router.push("/tickets");
    } catch (err: any) {
      alert(err.message || "Pembayaran gagal");
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    await api(`/bookings/${bookingId}/cancel`, { method: "POST", auth: true });
    router.push("/");
  }

  if (!booking) return <p className="text-zinc-400">Memuat...</p>;

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-4 text-2xl font-bold">Pembayaran</h1>

      <div className="rounded-lg bg-panel p-4 ring-1 ring-white/5">
        <h2 className="font-semibold">{booking.showtime?.movie?.title}</h2>
        <p className="text-sm text-zinc-400">
          {booking.showtime?.cinema?.name} · {booking.showtime?.auditoriumName}
        </p>
        <p className="text-sm text-zinc-400">
          {booking.showtime && formatDateTime(booking.showtime.startsAt)}
        </p>

        <div className="my-3 border-t border-white/10" />

        <div className="space-y-1 text-sm">
          {booking.seats.map((s) => (
            <div key={s.seatId} className="flex justify-between">
              <span>
                Kursi {s.rowLabel}
                {s.colNumber}
              </span>
              <span>{rupiah(s.price)}</span>
            </div>
          ))}
        </div>

        <div className="my-3 border-t border-white/10" />
        <div className="flex justify-between font-bold">
          <span>Total</span>
          <span>{rupiah(booking.totalPrice)}</span>
        </div>
      </div>

      {booking.status === "PENDING" && (
        <>
          <p className="mt-3 text-center text-sm text-zinc-400">
            Selesaikan dalam{" "}
            <span className="font-mono text-accent">
              {mm}:{ss}
            </span>
          </p>
          <button
            onClick={pay}
            disabled={busy || left === 0}
            className="mt-3 w-full rounded bg-accent py-3 font-medium disabled:opacity-50"
          >
            {busy ? "..." : "Bayar (mock)"}
          </button>
          <button
            onClick={cancel}
            className="mt-2 w-full rounded py-2 text-sm text-zinc-400"
          >
            Batalkan
          </button>
        </>
      )}

      {booking.status === "PAID" && (
        <p className="mt-4 text-center text-emerald-400">Sudah dibayar ✓</p>
      )}
    </div>
  );
}
