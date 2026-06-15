import { prisma } from "../../lib/prisma.js";
import { broadcastSeatsFreed } from "../realtime/realtime.js";

// Expire PENDING bookings past their hold window: delete them so the unique
// (showtimeId, seatId) BookingSeat rows free up, then notify rooms.
export async function expireStaleBookings() {
  const now = new Date();
  const stale = await prisma.booking.findMany({
    where: { status: "PENDING", expiresAt: { lt: now } },
    include: { seats: true },
  });
  for (const b of stale) {
    const seatIds = b.seats.map((s) => s.seatId);
    await prisma.$transaction([
      prisma.bookingSeat.deleteMany({ where: { bookingId: b.id } }),
      prisma.booking.update({
        where: { id: b.id },
        data: { status: "EXPIRED", expiresAt: null },
      }),
    ]);
    broadcastSeatsFreed(b.showtimeId, seatIds);
  }

  // Drop expired seat locks too.
  await prisma.seatLock.deleteMany({ where: { expiresAt: { lt: now } } });
}

// Run cleanup on an interval.
export function startBookingJanitor(intervalMs = 30_000) {
  setInterval(() => {
    expireStaleBookings().catch((e) => console.error("janitor error", e));
  }, intervalMs);
}
