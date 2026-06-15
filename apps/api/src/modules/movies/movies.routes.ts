import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { asyncHandler, HttpError } from "../../middleware/error.js";

export const moviesRouter = Router();

moviesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const status = req.query.status as string | undefined;
    const movies = await prisma.movie.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: { releaseDate: "desc" },
    });
    res.json(movies);
  })
);

moviesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const movie = await prisma.movie.findUnique({
      where: { id: req.params.id },
    });
    if (!movie) throw new HttpError(404, "Movie not found");
    res.json(movie);
  })
);
