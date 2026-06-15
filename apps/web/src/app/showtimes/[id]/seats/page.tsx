"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { getSocket } from "@/lib/socket";
import { rupiah, formatDateTime } from "@/lib/format";
import { SeatMap } from "@/components/SeatMap";
import { MiniMap } from "@/components/MiniMap";
import type { PovMode } from "@/components/SeatViewer3D";
import type { SeatMapResponse, SeatDTO, BookingDTO } from "@cinema-tix/shared";

const SeatViewer3D = dynamic(
  () => import("@/components/SeatViewer3D").then((m) => m.SeatViewer3D),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full place-items-center font-mono text-sm text-cream/40">
        Memuat studio 3D…
      </div>
    ),
  }
);

export default function SeatPickerPage() {
  const { id: showtimeId } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, accessToken } = useAuth();

  const [data, setData] = useState<SeatMapResponse | null>(null);
  const [selected, setSelected] = useState<Map<string, SeatDTO>>(new Map());
  const [focusId, setFocusId] = useState<string | null>(null); // POV open when set
  const [povMode, setPovMode] = useState<PovMode>("seat");
  const [showMini, setShowMini] = useState(true);
  const [busy, setBusy] = useState(false);

  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  useEffect(() => {
    if (!user) router.replace(`/login?next=/showtimes/${showtimeId}/seats`);
  }, [user, router, showtimeId]);

  const loadSeatMap = useCallback(() => {
    api<SeatMapResponse>(`/showtimes/${showtimeId}/seats`).then(setData);
  }, [showtimeId]);

  useEffect(() => {
    loadSeatMap();
  }, [loadSeatMap]);

  const patchSeat = useCallback((seatId: string, status: SeatDTO["status"]) => {
    setData((prev) =>
      prev
        ? {
            ...prev,
            seats: prev.seats.map((s) =>
              s.id === seatId ? { ...s, status } : s
            ),
          }
        : prev
    );
  }, []);

  // Socket realtime.
  useEffect(() => {
    if (!accessToken) return;
    const socket = getSocket(accessToken);
    socket.emit("showtime:join", showtimeId);
    socket.on("seat:locked", ({ seatId }) => patchSeat(seatId, "locked"));
    socket.on("seat:unlocked", ({ seatId }) => {
      if (!selectedRef.current.has(seatId)) patchSeat(seatId, "available");
    });
    socket.on("seat:booked", ({ seatIds }: { seatIds: string[] }) =>
      seatIds.forEach((sid) => patchSeat(sid, "booked"))
    );
    socket.on("seat:lock:denied", ({ seatId }: { seatId: string }) => {
      setSelected((prev) => {
        const next = new Map(prev);
        next.delete(seatId);
        return next;
      });
      patchSeat(seatId, "booked");
    });
    return () => {
      socket.off("seat:locked");
      socket.off("seat:unlocked");
      socket.off("seat:booked");
      socket.off("seat:lock:denied");
    };
  }, [accessToken, showtimeId, patchSeat]);

  const socket = accessToken ? () => getSocket(accessToken) : null;

  const addSeat = useCallback(
    (seat: SeatDTO) => {
      setSelected((prev) => {
        if (prev.has(seat.id) || prev.size >= 10) return prev;
        const next = new Map(prev);
        next.set(seat.id, seat);
        socket?.().emit("seat:lock", { showtimeId, seatId: seat.id });
        return next;
      });
    },
    [showtimeId, accessToken] // eslint-disable-line
  );

  const removeSeat = useCallback(
    (seat: SeatDTO) => {
      setSelected((prev) => {
        if (!prev.has(seat.id)) return prev;
        const next = new Map(prev);
        next.delete(seat.id);
        socket?.().emit("seat:unlock", { showtimeId, seatId: seat.id });
        patchSeat(seat.id, "available");
        return next;
      });
    },
    [showtimeId, accessToken, patchSeat] // eslint-disable-line
  );

  const toggleSeat = useCallback(
    (seat: SeatDTO) => {
      if (selectedRef.current.has(seat.id)) removeSeat(seat);
      else addSeat(seat);
    },
    [addSeat, removeSeat]
  );

  async function book() {
    if (selected.size === 0) return;
    setBusy(true);
    try {
      const booking = await api<BookingDTO>("/bookings", {
        method: "POST",
        auth: true,
        body: JSON.stringify({ showtimeId, seatIds: [...selected.keys()] }),
      });
      router.push(`/checkout/${booking.id}`);
    } catch (err: any) {
      alert(err.message || "Gagal memesan");
      loadSeatMap();
      setSelected(new Map());
    } finally {
      setBusy(false);
    }
  }

  const selectedList = useMemo(() => [...selected.values()], [selected]);
  const total = selectedList.reduce((sum, s) => sum + s.price, 0);

  // Default POV seat: last selected, else centre seat.
  const openPov = (seat?: SeatDTO) => {
    if (!data) return;
    const fallback =
      selectedList[selectedList.length - 1] ??
      data.seats[Math.floor(data.seats.length / 2)];
    setFocusId((seat ?? fallback).id);
    setPovMode("seat");
  };

  // Hop POV to a seat (from 3D tap or minimap) — always lands in seat mode.
  const hopToSeat = (seat: SeatDTO) => {
    setFocusId(seat.id);
    setPovMode("seat");
  };

  if (!data) return <p className="font-mono text-sm text-cream/40">Memuat kursi…</p>;

  const focusSeat = data.seats.find((s) => s.id === focusId) ?? null;
  const isFocusSelected = !!focusSeat && selected.has(focusSeat.id);
  const focusBookable =
    !!focusSeat &&
    focusSeat.status !== "booked" &&
    !(focusSeat.status === "locked" && !isFocusSelected);
  const canSwap =
    !!focusSeat && focusBookable && !isFocusSelected && selectedList.length > 0;

  function swapToFocus() {
    if (!focusSeat || !canSwap) return;
    removeSeat(selectedList[selectedList.length - 1]);
    addSeat(focusSeat);
  }

  return (
    <div className="animate-fade-up pb-36">
      <button
        onClick={() => router.back()}
        className="mb-4 font-mono text-xs text-cream/40 hover:text-gold"
      >
        ← Kembali
      </button>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl tracking-marquee text-cream">
            {data.showtime.movie?.title}
          </h1>
          <p className="font-mono text-xs text-cream/50">
            {data.showtime.cinema?.name} · {data.auditorium.name} ·{" "}
            {formatDateTime(data.showtime.startsAt)}
          </p>
        </div>
        <button onClick={() => openPov()} className="btn-ghost text-sm">
          🎥 Pratinjau 3D
        </button>
      </div>

      <div className="card p-5 sm:p-8">
        <SeatMap
          seats={data.seats}
          cols={data.auditorium.cols}
          screenLabel={data.auditorium.screenLabel}
          selected={new Set(selected.keys())}
          onToggle={toggleSeat}
          focusId={focusId}
        />
      </div>

      {/* ===== POV 3D modal ===== */}
      {focusSeat && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 pt-safe sm:px-5">
            <div className="min-w-0">
              <p className="font-mono text-[11px] uppercase tracking-widest text-gold">
                {povMode === "seat"
                  ? `POV Kursi ${focusSeat.rowLabel}${focusSeat.colNumber}`
                  : povMode === "screen"
                    ? "POV dari Layar"
                    : "Kamera Bebas"}
              </p>
              {/* mode switcher */}
              <div className="mt-1 flex gap-1 rounded-lg bg-black/40 p-1 ring-1 ring-white/10">
                {(
                  [
                    ["seat", "Kursi"],
                    ["screen", "Layar"],
                    ["free", "Bebas"],
                  ] as [PovMode, string][]
                ).map(([m, label]) => (
                  <button
                    key={m}
                    onClick={() => setPovMode(m)}
                    className={`rounded-md px-3 py-1 font-mono text-xs transition ${
                      povMode === m
                        ? "bg-gold text-ink"
                        : "text-cream/60 hover:text-cream"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => setShowMini((v) => !v)}
                className={`rounded-lg px-3 py-2 text-sm ring-1 ring-white/10 transition ${
                  showMini ? "bg-gold text-ink" : "bg-white/5 text-cream/70"
                }`}
                title="Peta kursi"
              >
                🗺
              </button>
              <button onClick={() => setFocusId(null)} className="btn-ghost text-sm">
                ✕
              </button>
            </div>
          </div>

          <div className="relative flex-1">
            <SeatViewer3D
              seats={data.seats}
              mode={povMode}
              focusId={focusSeat.id}
              selectedIds={new Set(selected.keys())}
              onFocusSeat={hopToSeat}
            />
            <p className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-center font-mono text-[11px] text-cream/60 backdrop-blur">
              {povMode === "free"
                ? "Seret memutar · scroll/cubit zoom · ketuk kursi untuk pilih POV"
                : "Seret untuk menengok · ketuk kursi untuk pindah POV"}
            </p>

            {/* Minimap — pick any seat to jump POV */}
            {showMini && (
              <div className="absolute right-2 top-2 w-32 sm:right-3 sm:top-3 sm:w-48">
                <MiniMap
                  seats={data.seats}
                  cols={data.auditorium.cols}
                  selected={new Set(selected.keys())}
                  focusId={focusSeat.id}
                  onPick={hopToSeat}
                />
              </div>
            )}
          </div>

          {/* Control panel */}
          <div className="border-t border-white/10 bg-panel/95 px-4 py-4 pb-safe backdrop-blur sm:px-5">
            {/* selected chips → jump POV (kembali ke kursi semula) */}
            {selectedList.length > 0 && (
              <div className="mb-3 flex items-center gap-2 overflow-x-auto">
                <span className="shrink-0 font-mono text-[11px] text-cream/40">
                  Kursimu:
                </span>
                {selectedList.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setFocusId(s.id)}
                    className={`shrink-0 rounded-lg px-3 py-1.5 font-mono text-xs transition ${
                      s.id === focusSeat.id
                        ? "bg-gold text-ink"
                        : "bg-crimson/80 text-white hover:bg-crimson"
                    }`}
                  >
                    {s.rowLabel}
                    {s.colNumber}
                  </button>
                ))}
              </div>
            )}

            {povMode === "seat" && (
              <div className="flex flex-wrap gap-2">
                {/* select / unselect current */}
                <button
                  onClick={() => toggleSeat(focusSeat)}
                  disabled={!focusBookable}
                  className={
                    isFocusSelected
                      ? "btn-ghost flex-1 disabled:opacity-40"
                      : "btn-primary flex-1 disabled:opacity-40"
                  }
                >
                  {isFocusSelected
                    ? "Lepas kursi ini"
                    : focusBookable
                      ? `Duduk di sini · ${rupiah(focusSeat.price)}`
                      : "Kursi tidak tersedia"}
                </button>

                {/* swap last selected → here (auto ganti kursi) */}
                {canSwap && (
                  <button onClick={swapToFocus} className="btn-ghost">
                    ⇄ Pindah ke sini
                  </button>
                )}
              </div>
            )}

            {selectedList.length > 0 && (
              <button
                onClick={() => {
                  setFocusId(null);
                  book();
                }}
                disabled={busy}
                className="mt-2 w-full rounded-lg bg-gold py-2.5 font-medium text-ink shadow-goldglow disabled:opacity-50"
              >
                Lanjut bayar · {selectedList.length} kursi · {rupiah(total)}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ===== bottom summary bar (2D mode) ===== */}
      {selectedList.length > 0 && !focusSeat && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-panel/95 pb-safe backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-5">
            <div className="min-w-0">
              <p className="truncate font-mono text-xs text-cream/60">
                {selectedList.map((s) => `${s.rowLabel}${s.colNumber}`).join(" · ")}
              </p>
              <p className="font-display text-2xl tracking-wide text-cream">
                {rupiah(total)}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openPov()} className="btn-ghost text-sm">
                🎥 POV 3D
              </button>
              <button
                onClick={book}
                disabled={busy}
                className="btn-primary disabled:opacity-50"
              >
                {busy ? "…" : "Bayar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
