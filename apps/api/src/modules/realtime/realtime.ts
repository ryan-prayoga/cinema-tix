import type { Server, Socket } from "socket.io";
import { prisma } from "../../lib/prisma.js";
import { verifyAccess } from "../../lib/jwt.js";
import { config } from "../../config.js";

let ioRef: Server | null = null;

const room = (showtimeId: string) => `showtime:${showtimeId}`;

interface AuthedSocket extends Socket {
  userId?: string;
}

export function setupRealtime(io: Server) {
  ioRef = io;

  // Authenticate socket via handshake token.
  io.use((socket: AuthedSocket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("Unauthorized"));
    try {
      socket.userId = verifyAccess(token).sub;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket: AuthedSocket) => {
    let joined: string | null = null;

    socket.on("showtime:join", (showtimeId: string) => {
      if (joined) socket.leave(room(joined));
      joined = showtimeId;
      socket.join(room(showtimeId));
    });

    // Try to lock a seat the user is selecting.
    socket.on("seat:lock", async ({ showtimeId, seatId }) => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + config.seatLockTtlSec * 1000);
      try {
        // Reject if already booked.
        const booked = await prisma.bookingSeat.findUnique({
          where: { showtimeId_seatId: { showtimeId, seatId } },
        });
        if (booked) {
          socket.emit("seat:lock:denied", { seatId, reason: "booked" });
          return;
        }
        const existing = await prisma.seatLock.findUnique({
          where: { showtimeId_seatId: { showtimeId, seatId } },
        });
        if (existing && existing.expiresAt > now && existing.userId !== socket.userId) {
          socket.emit("seat:lock:denied", { seatId, reason: "locked" });
          return;
        }
        await prisma.seatLock.upsert({
          where: { showtimeId_seatId: { showtimeId, seatId } },
          create: { showtimeId, seatId, userId: socket.userId!, expiresAt },
          update: { userId: socket.userId!, lockedAt: now, expiresAt },
        });
        socket.emit("seat:lock:granted", { seatId });
        socket
          .to(room(showtimeId))
          .emit("seat:locked", { seatId, byUserId: socket.userId });
      } catch (err) {
        console.error("seat:lock error", err);
      }
    });

    socket.on("seat:unlock", async ({ showtimeId, seatId }) => {
      try {
        const lock = await prisma.seatLock.findUnique({
          where: { showtimeId_seatId: { showtimeId, seatId } },
        });
        if (lock && lock.userId === socket.userId) {
          await prisma.seatLock.delete({
            where: { showtimeId_seatId: { showtimeId, seatId } },
          });
          io.to(room(showtimeId)).emit("seat:unlocked", { seatId });
        }
      } catch (err) {
        console.error("seat:unlock error", err);
      }
    });

    // Release this user's locks in the joined room on disconnect.
    socket.on("disconnect", async () => {
      if (!joined || !socket.userId) return;
      try {
        const locks = await prisma.seatLock.findMany({
          where: { showtimeId: joined, userId: socket.userId },
          select: { seatId: true },
        });
        if (locks.length === 0) return;
        await prisma.seatLock.deleteMany({
          where: { showtimeId: joined, userId: socket.userId },
        });
        for (const l of locks) {
          io.to(room(joined)).emit("seat:unlocked", { seatId: l.seatId });
        }
      } catch (err) {
        console.error("disconnect cleanup error", err);
      }
    });
  });
}

// Called by booking confirm to mark seats permanently taken for everyone.
export function broadcastSeatsBooked(showtimeId: string, seatIds: string[]) {
  ioRef?.to(room(showtimeId)).emit("seat:booked", { seatIds });
}

// Broadcast seats freed (booking cancelled/expired).
export function broadcastSeatsFreed(showtimeId: string, seatIds: string[]) {
  for (const seatId of seatIds) {
    ioRef?.to(room(showtimeId)).emit("seat:unlocked", { seatId });
  }
}
