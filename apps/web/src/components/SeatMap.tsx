"use client";

import { useMemo } from "react";
import type { SeatDTO } from "@cinema-tix/shared";

interface Props {
  seats: SeatDTO[];
  screenLabel: string;
  selected: Set<string>;
  onToggle: (seat: SeatDTO) => void;
  // Optional: seat currently previewed in 3D (gets a ring).
  focusId?: string | null;
}

function seatClass(seat: SeatDTO, isSelected: boolean, isFocus: boolean): string {
  const ring = isFocus ? " ring-2 ring-gold ring-offset-1 ring-offset-ink" : "";
  if (isSelected) return "bg-crimson text-white shadow-glow" + ring;
  switch (seat.status) {
    case "booked":
      return "bg-white/5 text-cream/20 cursor-not-allowed" + ring;
    case "locked":
      return "bg-gold/25 text-gold cursor-not-allowed" + ring;
    default:
      return (
        (seat.type === "PREMIUM"
          ? "bg-crimson/15 text-cream/70 ring-1 ring-crimson/40 hover:bg-crimson/40 hover:text-white"
          : "bg-white/10 text-cream/60 hover:bg-crimson/60 hover:text-white") + ring
      );
  }
}

export function SeatMap({ seats, screenLabel, selected, onToggle, focusId }: Props) {
  const rows = useMemo(() => {
    const map = new Map<string, SeatDTO[]>();
    for (const s of seats) {
      if (!map.has(s.rowLabel)) map.set(s.rowLabel, []);
      map.get(s.rowLabel)!.push(s);
    }
    for (const list of map.values())
      list.sort((a, b) => a.colNumber - b.colNumber);
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [seats]);

  return (
    <div className="flex flex-col items-center">
      {/* Glowing curved screen */}
      <div className="mb-10 w-full max-w-lg">
        <div className="relative mx-auto h-10 w-4/5">
          <div
            className="absolute inset-x-0 top-0 h-10 rounded-[100%] bg-gradient-to-b from-cream/80 via-gold/40 to-transparent blur-[2px]"
            style={{ clipPath: "polygon(6% 0, 94% 0, 100% 60%, 0 60%)" }}
          />
          <div className="absolute inset-x-[15%] top-10 h-16 bg-gradient-to-b from-cream/15 to-transparent blur-md" />
        </div>
        <p className="mt-2 text-center font-mono text-[11px] tracking-[0.5em] text-cream/40">
          {screenLabel}
        </p>
      </div>

      <div className="space-y-2 overflow-x-auto pb-2">
        {rows.map(([label, rowSeats]) => (
          <div key={label} className="flex items-center gap-2">
            <span className="w-5 text-center font-mono text-[11px] text-cream/30">
              {label}
            </span>
            <div className="flex gap-1.5">
              {rowSeats.map((seat) => {
                const isSelected = selected.has(seat.id);
                const disabled =
                  seat.status === "booked" ||
                  (seat.status === "locked" && !isSelected);
                return (
                  <button
                    key={seat.id}
                    disabled={disabled}
                    onClick={() => onToggle(seat)}
                    title={`${seat.rowLabel}${seat.colNumber} · ${seat.type}`}
                    className={`grid h-7 w-7 place-items-center rounded-md rounded-b-lg font-mono text-[10px] transition ${seatClass(
                      seat,
                      isSelected,
                      seat.id === focusId
                    )}`}
                  >
                    {seat.colNumber}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-8 flex flex-wrap justify-center gap-x-4 gap-y-2 font-mono text-[11px] text-cream/50">
        <Legend cls="bg-white/10" label="Kosong" />
        <Legend cls="bg-crimson/15 ring-1 ring-crimson/40" label="Premium" />
        <Legend cls="bg-crimson shadow-glow" label="Pilihanmu" />
        <Legend cls="bg-gold/25" label="Dipilih org lain" />
        <Legend cls="bg-white/5" label="Terisi" />
      </div>
    </div>
  );
}

function Legend({ cls, label }: { cls: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`inline-block h-3 w-3 rounded ${cls}`} />
      {label}
    </span>
  );
}
