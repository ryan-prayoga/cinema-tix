"use client";

import { useMemo } from "react";
import type { SeatDTO } from "@cinema-tix/shared";

interface Props {
  seats: SeatDTO[];
  cols: number;
  selected: Set<string>;
  focusId: string | null;
  onPick: (seat: SeatDTO) => void;
}

function dot(seat: SeatDTO, isSelected: boolean, isFocus: boolean): string {
  if (isFocus) return "bg-gold ring-1 ring-cream";
  if (isSelected) return "bg-crimson";
  if (seat.status === "booked") return "bg-white/10";
  if (seat.status === "locked") return "bg-gold/40";
  if (seat.type === "PREMIUM") return "bg-crimson/40";
  if (seat.type === "DISABLED") return "bg-sky-500/50";
  return "bg-cream/30 hover:bg-cream/60";
}

// Compact top-down map to jump POV between seats inside the 3D modal.
export function MiniMap({ seats, cols, selected, focusId, onPick }: Props) {
  const rows = useMemo(() => {
    const map = new Map<string, Map<number, SeatDTO>>();
    for (const s of seats) {
      if (!map.has(s.rowLabel)) map.set(s.rowLabel, new Map());
      map.get(s.rowLabel)!.set(s.colNumber, s);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [seats]);

  return (
    <div className="rounded-xl bg-black/70 p-3 ring-1 ring-white/10 backdrop-blur">
      <p className="mb-1.5 text-center font-mono text-[9px] tracking-[0.3em] text-cream/40">
        ▔ LAYAR ▔
      </p>
      <div className="space-y-[3px]">
        {rows.map(([label, rowSeats]) => (
          <div key={label} className="flex justify-center gap-[3px]">
            {Array.from({ length: cols }, (_, i) => i + 1).map((col) => {
              const seat = rowSeats.get(col);
              if (!seat) return <span key={col} className="h-2.5 w-2.5" />;
              const disabled =
                seat.status === "booked" ||
                (seat.status === "locked" && !selected.has(seat.id));
              return (
                <button
                  key={col}
                  disabled={disabled}
                  onClick={() => onPick(seat)}
                  title={`${seat.rowLabel}${seat.colNumber}`}
                  className={`h-2.5 w-2.5 rounded-[2px] transition disabled:cursor-not-allowed ${dot(
                    seat,
                    selected.has(seat.id),
                    seat.id === focusId
                  )}`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
