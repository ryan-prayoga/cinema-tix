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

  if (!booking) return <p className="font-mono text-sm text-cream/40">Memuat...</p>;

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  return (
    <div className="mx-auto mt-4 max-w-md animate-fade-up">
      <h1 className="mb-5 font-display text-4xl tracking-marquee text-cream">
        Pembayaran
      </h1>

      {/* Ticket stub */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-panel2 to-panel ring-1 ring-white/10">
        <div className="absolute left-0 top-0 h-full w-1.5 bg-crimson" />
        <div className="p-6">
          <h2 className="font-display text-2xl tracking-wide text-cream">
            {booking.showtime?.movie?.title}
          </h2>
          <p className="mt-1 font-mono text-xs text-cream/50">
            {booking.showtime?.cinema?.name} · {booking.showtime?.auditoriumName}
          </p>
          <p className="font-mono text-xs text-gold">
            {booking.showtime && formatDateTime(booking.showtime.startsAt)}
          </p>

          {/* perforation — notch circles sit on the card edges, clipped by overflow */}
          <div className="relative my-5 h-0">
            <span className="absolute -left-6 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-ink" />
            <span className="absolute -right-6 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-ink" />
            <div className="border-t border-dashed border-white/15" />
          </div>

          <div className="space-y-1.5 font-mono text-sm">
            {booking.seats.map((s) => (
              <div key={s.seatId} className="flex justify-between text-cream/80">
                <span>
                  Kursi{" "}
                  <span className="text-gold">
                    {s.rowLabel}
                    {s.colNumber}
                  </span>
                </span>
                <span>{rupiah(s.price)}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-baseline justify-between border-t border-white/10 pt-4">
            <span className="font-mono text-xs uppercase tracking-widest text-cream/50">
              Total
            </span>
            <span className="font-display text-3xl tracking-wide text-cream">
              {rupiah(booking.totalPrice)}
            </span>
          </div>
        </div>
      </div>

      {booking.status === "PENDING" && (
        <>
          <p className="mt-4 text-center font-mono text-xs text-cream/50">
            Selesaikan dalam{" "}
            <span className="text-lg text-crimson-glow">
              {mm}:{ss}
            </span>
          </p>
          <button
            onClick={pay}
            disabled={busy || left === 0}
            className="btn-primary mt-3 w-full py-3.5 text-base disabled:opacity-50"
          >
            {busy ? "..." : "Bayar Sekarang"}
          </button>
          <button
            onClick={cancel}
            className="mt-2 w-full py-2 font-mono text-xs text-cream/40 hover:text-crimson-glow"
          >
            Batalkan pesanan
          </button>
        </>
      )}

      {booking.status === "PAID" && (
        <p className="mt-5 text-center font-mono text-sm text-gold">
          ✓ Sudah dibayar
        </p>
      )}
    </div>
  );
}
