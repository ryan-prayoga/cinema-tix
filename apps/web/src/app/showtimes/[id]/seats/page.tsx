"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { getSocket } from "@/lib/socket";
import { rupiah, formatDateTime } from "@/lib/format";
import { SeatMap } from "@/components/SeatMap";
import type {
  SeatMapResponse,
  SeatDTO,
  BookingDTO,
} from "@cinema-tix/shared";

// 3D viewer is heavy — load only on demand, client-side.
const SeatViewer3D = dynamic(
  () => import("@/components/SeatViewer3D").then((m) => m.SeatViewer3D),
  { ssr: false, loading: () => <p className="p-8 text-center">Memuat 3D...</p> }
);

export default function SeatPickerPage() {
  const { id: showtimeId } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, accessToken } = useAuth();

  const [data, setData] = useState<SeatMapResponse | null>(null);
  const [selected, setSelected] = useState<Map<string, SeatDTO>>(new Map());
  const [pov, setPov] = useState<SeatDTO | null>(null);
  const [busy, setBusy] = useState(false);

  // Keep selection in a ref so socket handlers read latest without re-binding.
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  // Redirect to login if not authed.
  useEffect(() => {
    if (!user) router.replace(`/login?next=/showtimes/${showtimeId}/seats`);
  }, [user, router, showtimeId]);

  const loadSeatMap = useCallback(() => {
    api<SeatMapResponse>(`/showtimes/${showtimeId}/seats`).then(setData);
  }, [showtimeId]);

  useEffect(() => {
    loadSeatMap();
  }, [loadSeatMap]);

  // Mutate a single seat's status in local state.
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

  // Socket: join room, listen for everyone's lock/unlock/booked events.
  useEffect(() => {
    if (!accessToken) return;
    const socket = getSocket(accessToken);
    socket.emit("showtime:join", showtimeId);

    socket.on("seat:locked", ({ seatId }) => patchSeat(seatId, "locked"));
    socket.on("seat:unlocked", ({ seatId }) => {
      if (!selectedRef.current.has(seatId)) patchSeat(seatId, "available");
    });
    socket.on("seat:booked", ({ seatIds }: { seatIds: string[] }) => {
      seatIds.forEach((sid) => patchSeat(sid, "booked"));
    });
    socket.on("seat:lock:denied", ({ seatId }: { seatId: string }) => {
      // Lost the race — drop from selection and mark taken.
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

  function toggleSeat(seat: SeatDTO) {
    const socket = accessToken ? getSocket(accessToken) : null;
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(seat.id)) {
        next.delete(seat.id);
        socket?.emit("seat:unlock", { showtimeId, seatId: seat.id });
        patchSeat(seat.id, "available");
      } else {
        if (next.size >= 10) return prev; // max 10 seats
        next.set(seat.id, seat);
        socket?.emit("seat:lock", { showtimeId, seatId: seat.id });
      }
      return next;
    });
  }

  async function book() {
    if (selected.size === 0) return;
    setBusy(true);
    try {
      const booking = await api<BookingDTO>("/bookings", {
        method: "POST",
        auth: true,
        body: JSON.stringify({
          showtimeId,
          seatIds: [...selected.keys()],
        }),
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

  if (!data) return <p className="text-zinc-400">Memuat kursi...</p>;

  const selectedList = [...selected.values()];
  const total = selectedList.reduce((sum, s) => sum + s.price, 0);

  return (
    <div className="pb-32">
      <div className="mb-4">
        <h1 className="text-xl font-bold">{data.showtime.movie?.title}</h1>
        <p className="text-sm text-zinc-400">
          {data.showtime.cinema?.name} · {data.auditorium.name} ·{" "}
          {formatDateTime(data.showtime.startsAt)}
        </p>
      </div>

      <SeatMap
        seats={data.seats}
        screenLabel={data.auditorium.screenLabel}
        selected={new Set(selected.keys())}
        onToggle={toggleSeat}
      />

      {/* POV 3D modal */}
      {pov && (
        <div className="fixed inset-0 z-40 flex flex-col bg-black/90">
          <div className="flex items-center justify-between p-4">
            <span className="font-semibold">
              POV kursi {pov.rowLabel}
              {pov.colNumber}
            </span>
            <button
              onClick={() => setPov(null)}
              className="rounded bg-panel px-3 py-1 text-sm ring-1 ring-white/10"
            >
              Tutup
            </button>
          </div>
          <div className="flex-1">
            <SeatViewer3D seats={data.seats} focusSeat={pov} />
          </div>
          <p className="p-3 text-center text-xs text-zinc-400">
            Geser untuk menengok. Ini perkiraan pandangan dari kursi ini ke layar.
          </p>
        </div>
      )}

      {/* Bottom summary bar */}
      {selectedList.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-panel/95 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm">
                {selectedList
                  .map((s) => `${s.rowLabel}${s.colNumber}`)
                  .join(", ")}
              </p>
              <p className="font-bold">{rupiah(total)}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPov(selectedList[selectedList.length - 1])}
                className="rounded bg-ink px-3 py-2 text-sm ring-1 ring-white/15"
              >
                Lihat POV 3D
              </button>
              <button
                onClick={book}
                disabled={busy}
                className="rounded bg-accent px-4 py-2 font-medium disabled:opacity-50"
              >
                {busy ? "..." : "Bayar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
