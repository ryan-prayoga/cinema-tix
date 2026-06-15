import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { asyncHandler, HttpError } from "../../middleware/error.js";
import { getSeatMap } from "../seats/seats.service.js";

export const showtimesRouter = Router();

showtimesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { movieId, cinemaId, date } = req.query as Record<string, string>;

    let startsAt;
    if (date) {
      const day = new Date(date + "T00:00:00");
      const next = new Date(day);
      next.setDate(next.getDate() + 1);
      startsAt = { gte: day, lt: next };
    }

    const showtimes = await prisma.showtime.findMany({
      where: {
        movieId: movieId || undefined,
        startsAt,
        auditorium: cinemaId ? { cinemaId } : undefined,
      },
      orderBy: { startsAt: "asc" },
      include: {
        movie: true,
        auditorium: { include: { cinema: true } },
      },
    });

    res.json(
      showtimes.map((s) => ({
        id: s.id,
        movieId: s.movieId,
        auditoriumId: s.auditoriumId,
        startsAt: s.startsAt.toISOString(),
        basePrice: s.basePrice,
        priceMultiplier: s.priceMultiplier,
        movie: s.movie,
        cinema: s.auditorium.cinema,
        auditoriumName: s.auditorium.name,
      }))
    );
  })
);

showtimesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const s = await prisma.showtime.findUnique({
      where: { id: req.params.id },
      include: { movie: true, auditorium: { include: { cinema: true } } },
    });
    if (!s) throw new HttpError(404, "Showtime not found");
    res.json({
      id: s.id,
      movieId: s.movieId,
      auditoriumId: s.auditoriumId,
      startsAt: s.startsAt.toISOString(),
      basePrice: s.basePrice,
      priceMultiplier: s.priceMultiplier,
      movie: s.movie,
      cinema: s.auditorium.cinema,
      auditoriumName: s.auditorium.name,
    });
  })
);

// Seat map with per-seat status + price for this showtime.
showtimesRouter.get(
  "/:id/seats",
  asyncHandler(async (req, res) => {
    res.json(await getSeatMap(req.params.id));
  })
);
