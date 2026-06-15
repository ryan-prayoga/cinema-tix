"use client";

import { useMemo } from "react";
import type { SeatDTO } from "@cinema-tix/shared";

interface Props {
  seats: SeatDTO[];
  cols: number; // auditorium width — drives aisle gaps
  screenLabel: string;
  selected: Set<string>;
  onToggle: (seat: SeatDTO) => void;
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
      if (seat.type === "PREMIUM")
        return (
          "bg-crimson/20 text-gold ring-1 ring-gold/40 hover:bg-crimson/50 hover:text-white" +
          ring
        );
      if (seat.type === "DISABLED")
        return (
          "bg-sky-500/20 text-sky-300 ring-1 ring-sky-400/40 hover:bg-sky-500/40" +
          ring
        );
      return "bg-white/10 text-cream/60 hover:bg-crimson/60 hover:text-white" + ring;
  }
}

export function SeatMap({
  seats,
  cols,
  screenLabel,
  selected,
  onToggle,
  focusId,
}: Props) {
  // Group into rows; index each row by colNumber so we can render aisle gaps.
  const rows = useMemo(() => {
    const map = new Map<string, Map<number, SeatDTO>>();
    for (const s of seats) {
      if (!map.has(s.rowLabel)) map.set(s.rowLabel, new Map());
      map.get(s.rowLabel)!.set(s.colNumber, s);
    }
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

      <div className="no-scrollbar w-full overflow-x-auto pb-2">
       <div className="mx-auto w-max space-y-2">
        {rows.map(([label, rowSeats]) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="w-5 shrink-0 text-center font-mono text-[11px] text-cream/30">
              {label}
            </span>
            {Array.from({ length: cols }, (_, i) => i + 1).map((col) => {
              const seat = rowSeats.get(col);
              if (!seat)
                return <span key={col} className="h-8 w-8 shrink-0 sm:h-7 sm:w-7" />;
              const isSelected = selected.has(seat.id);
              const disabled =
                seat.status === "booked" ||
                (seat.status === "locked" && !isSelected);
              return (
                <button
                  key={col}
                  disabled={disabled}
                  onClick={() => onToggle(seat)}
                  title={`${seat.rowLabel}${seat.colNumber} · ${seat.type}`}
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-md rounded-b-lg font-mono text-[11px] transition active:scale-90 sm:h-7 sm:w-7 sm:text-[10px] ${seatClass(
                    seat,
                    isSelected,
                    seat.id === focusId
                  )}`}
                >
                  {seat.type === "DISABLED" ? "♿" : seat.colNumber}
                </button>
              );
            })}
          </div>
        ))}
       </div>
      </div>

      {/* Legend */}
      <div className="mt-8 flex flex-wrap justify-center gap-x-4 gap-y-2 font-mono text-[11px] text-cream/50">
        <Legend cls="bg-white/10" label="Reguler" />
        <Legend cls="bg-crimson/20 ring-1 ring-gold/40" label="Premium" />
        <Legend cls="bg-sky-500/20 ring-1 ring-sky-400/40" label="Aksesibel" />
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
