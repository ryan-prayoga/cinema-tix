import { Router } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { seatPrice } from "../../lib/price.js";
import { config } from "../../config.js";
import { asyncHandler, HttpError } from "../../middleware/error.js";
import { requireAuth, type AuthedRequest } from "../../middleware/auth.js";
import {
  broadcastSeatsBooked,
  broadcastSeatsFreed,
} from "../realtime/realtime.js";
import type { BookingDTO } from "@cinema-tix/shared";

export const bookingsRouter = Router();
bookingsRouter.use(requireAuth);

const createSchema = z.object({
  showtimeId: z.string(),
  seatIds: z.array(z.string()).min(1).max(10),
});

function toDTO(b: any): BookingDTO {
  return {
    id: b.id,
    showtimeId: b.showtimeId,
    status: b.status,
    totalPrice: b.totalPrice,
    createdAt: b.createdAt.toISOString(),
    expiresAt: b.expiresAt ? b.expiresAt.toISOString() : null,
    seats: b.seats.map((s: any) => ({
      seatId: s.seatId,
      rowLabel: s.seat?.rowLabel,
      colNumber: s.seat?.colNumber,
      price: s.price,
    })),
    showtime: b.showtime
      ? {
          id: b.showtime.id,
          movieId: b.showtime.movieId,
          auditoriumId: b.showtime.auditoriumId,
          startsAt: b.showtime.startsAt.toISOString(),
          basePrice: b.showtime.basePrice,
          priceMultiplier: b.showtime.priceMultiplier,
          movie: b.showtime.movie,
          cinema: b.showtime.auditorium?.cinema,
          auditoriumName: b.showtime.auditorium?.name,
        }
      : undefined,
  };
}

// Create a held booking (status PENDING). DB transaction + unique
// (showtimeId, seatId) on BookingSeat is the real guard against double-booking.
bookingsRouter.post(
  "/",
  asyncHandler(async (req: AuthedRequest, res) => {
    const { showtimeId, seatIds } = createSchema.parse(req.body);
    const userId = req.user!.sub;

    const showtime = await prisma.showtime.findUnique({
      where: { id: showtimeId },
    });
    if (!showtime) throw new HttpError(404, "Showtime not found");

    const seats = await prisma.seat.findMany({
      where: { id: { in: seatIds }, auditoriumId: showtime.auditoriumId },
    });
    if (seats.length !== seatIds.length) {
      throw new HttpError(400, "Some seats are invalid for this showtime");
    }

    const priced = seats.map((s) => ({
      seatId: s.id,
      price: seatPrice(showtime.basePrice, showtime.priceMultiplier, s.type),
    }));
    const totalPrice = priced.reduce((sum, p) => sum + p.price, 0);
    const expiresAt = new Date(Date.now() + config.bookingHoldTtlSec * 1000);

    let booking;
    try {
      booking = await prisma.$transaction(async (tx) => {
        const b = await tx.booking.create({
          data: { userId, showtimeId, status: "PENDING", totalPrice, expiresAt },
        });
        await tx.bookingSeat.createMany({
          data: priced.map((p) => ({
            bookingId: b.id,
            seatId: p.seatId,
            showtimeId,
            price: p.price,
          })),
        });
        // Release this user's holds now that they're committed to a booking.
        await tx.seatLock.deleteMany({
          where: { showtimeId, seatId: { in: seatIds }, userId },
        });
        return b;
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        throw new HttpError(409, "One or more seats were just taken");
      }
      throw e;
    }

    const full = await prisma.booking.findUnique({
      where: { id: booking.id },
      include: { seats: { include: { seat: true } } },
    });
    res.status(201).json(toDTO(full));
  })
);

// Mock payment — instantly mark PAID and broadcast seats taken.
bookingsRouter.post(
  "/:id/confirm",
  asyncHandler(async (req: AuthedRequest, res) => {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { seats: true },
    });
    if (!booking || booking.userId !== req.user!.sub) {
      throw new HttpError(404, "Booking not found");
    }
    if (booking.status !== "PENDING") {
      throw new HttpError(409, `Booking is ${booking.status}`);
    }
    if (booking.expiresAt && booking.expiresAt < new Date()) {
      throw new HttpError(410, "Booking hold expired");
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "PAID", expiresAt: null },
      include: {
        seats: { include: { seat: true } },
        showtime: { include: { movie: true, auditorium: { include: { cinema: true } } } },
      },
    });
    broadcastSeatsBooked(
      booking.showtimeId,
      booking.seats.map((s) => s.seatId)
    );
    res.json(toDTO(updated));
  })
);

// Cancel a PENDING booking, freeing its seats.
bookingsRouter.post(
  "/:id/cancel",
  asyncHandler(async (req: AuthedRequest, res) => {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { seats: true },
    });
    if (!booking || booking.userId !== req.user!.sub) {
      throw new HttpError(404, "Booking not found");
    }
    if (booking.status !== "PENDING") {
      throw new HttpError(409, `Cannot cancel a ${booking.status} booking`);
    }
    const seatIds = booking.seats.map((s) => s.seatId);
    await prisma.$transaction([
      prisma.bookingSeat.deleteMany({ where: { bookingId: booking.id } }),
      prisma.booking.update({
        where: { id: booking.id },
        data: { status: "CANCELLED", expiresAt: null },
      }),
    ]);
    broadcastSeatsFreed(booking.showtimeId, seatIds);
    res.json({ ok: true });
  })
);

// NOTE: /me must be registered before /:id or Express matches id="me".
bookingsRouter.get(
  "/me",
  asyncHandler(async (req: AuthedRequest, res) => {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.user!.sub },
      orderBy: { createdAt: "desc" },
      include: {
        seats: { include: { seat: true } },
        showtime: { include: { movie: true, auditorium: { include: { cinema: true } } } },
      },
    });
    res.json(bookings.map(toDTO));
  })
);

bookingsRouter.get(
  "/:id",
  asyncHandler(async (req: AuthedRequest, res) => {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        seats: { include: { seat: true } },
        showtime: { include: { movie: true, auditorium: { include: { cinema: true } } } },
      },
    });
    if (!booking || booking.userId !== req.user!.sub) {
      throw new HttpError(404, "Booking not found");
    }
    res.json(toDTO(booking));
  })
);
