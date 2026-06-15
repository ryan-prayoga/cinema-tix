"use client";

import { useMemo } from "react";
import type { SeatDTO } from "@cinema-tix/shared";

interface Props {
  seats: SeatDTO[];
  screenLabel: string;
  selected: Set<string>;
  onToggle: (seat: SeatDTO) => void;
}

// Tailwind color per seat status.
function seatClass(seat: SeatDTO, isSelected: boolean): string {
  if (isSelected) return "bg-accent text-white";
  switch (seat.status) {
    case "booked":
      return "bg-zinc-700 text-zinc-500 cursor-not-allowed";
    case "locked":
      return "bg-yellow-600/70 text-yellow-100 cursor-not-allowed";
    default:
      return seat.type === "PREMIUM"
        ? "bg-emerald-700/40 ring-1 ring-emerald-400/40 hover:bg-emerald-600"
        : "bg-emerald-700/30 hover:bg-emerald-600";
  }
}

export function SeatMap({ seats, screenLabel, selected, onToggle }: Props) {
  // Group seats into rows keyed by rowLabel.
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
      {/* Screen */}
      <div className="mb-6 w-full max-w-md">
        <div className="mx-auto h-2 w-3/4 rounded-t-[100%] bg-gradient-to-b from-white/60 to-white/5" />
        <p className="mt-1 text-center text-xs tracking-[0.3em] text-zinc-400">
          {screenLabel}
        </p>
      </div>

      <div className="space-y-1.5">
        {rows.map(([label, rowSeats]) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="w-4 text-center text-xs text-zinc-500">
              {label}
            </span>
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
                  className={`h-6 w-6 rounded text-[10px] font-medium transition ${seatClass(
                    seat,
                    isSelected
                  )}`}
                >
                  {seat.colNumber}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap justify-center gap-3 text-xs text-zinc-400">
        <Legend className="bg-emerald-700/30" label="Kosong" />
        <Legend className="bg-emerald-700/40 ring-1 ring-emerald-400/40" label="Premium" />
        <Legend className="bg-accent" label="Pilihan kamu" />
        <Legend className="bg-yellow-600/70" label="Dipilih orang lain" />
        <Legend className="bg-zinc-700" label="Terisi" />
      </div>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={`inline-block h-3 w-3 rounded ${className}`} />
      {label}
    </span>
  );
}
