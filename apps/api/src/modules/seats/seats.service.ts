import { prisma } from "../../lib/prisma.js";
import { seatPrice } from "../../lib/price.js";
import { HttpError } from "../../middleware/error.js";
import type { SeatMapResponse, SeatStatus } from "@cinema-tix/shared";

// Builds the seat map for a showtime: every seat tagged available/booked/locked
// plus its server-computed price. excludeUserId keeps a caller's own locks as
// "available" so they can still book what they're holding.
export async function getSeatMap(
  showtimeId: string,
  excludeUserId?: string
): Promise<SeatMapResponse> {
  const showtime = await prisma.showtime.findUnique({
    where: { id: showtimeId },
    include: { movie: true, auditorium: { include: { cinema: true } } },
  });
  if (!showtime) throw new HttpError(404, "Showtime not found");

  const aud = showtime.auditorium;
  const now = new Date();

  const [seats, booked, locks] = await Promise.all([
    prisma.seat.findMany({
      where: { auditoriumId: aud.id },
      orderBy: [{ rowLabel: "asc" }, { colNumber: "asc" }],
    }),
    prisma.bookingSeat.findMany({
      where: { showtimeId },
      select: { seatId: true },
    }),
    prisma.seatLock.findMany({
      where: { showtimeId, expiresAt: { gt: now } },
      select: { seatId: true, userId: true },
    }),
  ]);

  const bookedSet = new Set(booked.map((b) => b.seatId));
  const lockedByOther = new Set(
    locks.filter((l) => l.userId !== excludeUserId).map((l) => l.seatId)
  );

  return {
    showtime: {
      id: showtime.id,
      movieId: showtime.movieId,
      auditoriumId: showtime.auditoriumId,
      startsAt: showtime.startsAt.toISOString(),
      basePrice: showtime.basePrice,
      priceMultiplier: showtime.priceMultiplier,
      movie: showtime.movie as any,
      cinema: aud.cinema as any,
      auditoriumName: aud.name,
    },
    auditorium: {
      id: aud.id,
      name: aud.name,
      screenLabel: aud.screenLabel,
      rows: aud.rows,
      cols: aud.cols,
    },
    seats: seats.map((s) => {
      let status: SeatStatus = "available";
      if (bookedSet.has(s.id)) status = "booked";
      else if (lockedByOther.has(s.id)) status = "locked";
      return {
        id: s.id,
        rowLabel: s.rowLabel,
        colNumber: s.colNumber,
        type: s.type,
        x: s.x,
        y: s.y,
        z: s.z,
        status,
        price: seatPrice(showtime.basePrice, showtime.priceMultiplier, s.type),
      };
    }),
  };
}
