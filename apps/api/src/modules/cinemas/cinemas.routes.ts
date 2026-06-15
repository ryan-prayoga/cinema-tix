import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { asyncHandler, HttpError } from "../../middleware/error.js";

export const cinemasRouter = Router();

cinemasRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const city = req.query.city as string | undefined;
    const cinemas = await prisma.cinema.findMany({
      where: city ? { city } : undefined,
      orderBy: { name: "asc" },
    });
    res.json(cinemas);
  })
);

cinemasRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const cinema = await prisma.cinema.findUnique({
      where: { id: req.params.id },
      include: { auditoriums: { select: { id: true, name: true } } },
    });
    if (!cinema) throw new HttpError(404, "Cinema not found");
    res.json(cinema);
  })
);
