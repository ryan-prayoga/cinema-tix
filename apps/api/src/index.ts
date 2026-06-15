import express from "express";
import cors from "cors";
import helmet from "helmet";
import { createServer } from "http";
import { Server } from "socket.io";
import { config } from "./config.js";
import { errorHandler } from "./middleware/error.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { moviesRouter } from "./modules/movies/movies.routes.js";
import { cinemasRouter } from "./modules/cinemas/cinemas.routes.js";
import { showtimesRouter } from "./modules/showtimes/showtimes.routes.js";
import { bookingsRouter } from "./modules/bookings/bookings.routes.js";
import { setupRealtime } from "./modules/realtime/realtime.js";
import { startBookingJanitor } from "./modules/bookings/bookings.service.js";

const app = express();
app.use(helmet());
app.use(cors({ origin: config.webOrigin, credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/auth", authRouter);
app.use("/movies", moviesRouter);
app.use("/cinemas", cinemasRouter);
app.use("/showtimes", showtimesRouter);
app.use("/bookings", bookingsRouter);

app.use(errorHandler);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: config.webOrigin, credentials: true },
});
setupRealtime(io);
startBookingJanitor();

httpServer.listen(config.port, () => {
  console.log(`API + Socket.IO listening on http://localhost:${config.port}`);
});
