import { PrismaClient, SeatType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Build seat rows for an auditorium with layout coords.
// x = horizontal (per column), y = depth from screen (per row), z = tier height.
function buildSeats(rows: number, cols: number) {
  const SEAT_GAP = 1.0; // metres between seat centres
  const ROW_GAP = 1.1;
  const TIER_STEP = 0.25; // each row back rises this much
  const seats: {
    rowLabel: string;
    colNumber: number;
    type: SeatType;
    x: number;
    y: number;
    z: number;
  }[] = [];
  for (let r = 0; r < rows; r++) {
    const rowLabel = String.fromCharCode(65 + r); // A, B, C...
    // Back two rows are PREMIUM; aisle seats stay regular.
    const isPremium = r >= rows - 2;
    for (let c = 1; c <= cols; c++) {
      seats.push({
        rowLabel,
        colNumber: c,
        type: isPremium ? "PREMIUM" : "REGULAR",
        x: (c - (cols + 1) / 2) * SEAT_GAP, // centre around 0
        y: (r + 1) * ROW_GAP, // distance from screen
        z: r * TIER_STEP,
      });
    }
  }
  return seats;
}

async function main() {
  console.log("Seeding...");

  // Wipe (dev only) in FK-safe order.
  await prisma.bookingSeat.deleteMany();
  await prisma.seatLock.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.showtime.deleteMany();
  await prisma.seat.deleteMany();
  await prisma.auditorium.deleteMany();
  await prisma.cinema.deleteMany();
  await prisma.movie.deleteMany();
  await prisma.user.deleteMany();

  // Demo user
  await prisma.user.create({
    data: {
      email: "demo@cinema.test",
      name: "Demo User",
      passwordHash: await bcrypt.hash("password123", 10),
    },
  });

  // Movies
  const movies = await Promise.all(
    [
      {
        title: "Quantum Horizon",
        synopsis: "Tim ilmuwan menembus batas ruang-waktu untuk selamatkan Bumi.",
        durationMin: 142,
        rating: "13+",
        genres: ["Sci-Fi", "Action"],
        posterUrl: "https://picsum.photos/seed/quantum/400/600",
        releaseDate: new Date("2026-05-01"),
      },
      {
        title: "Senja di Jakarta",
        synopsis: "Kisah cinta dua orang asing di tengah hiruk kota.",
        durationMin: 118,
        rating: "13+",
        genres: ["Drama", "Romance"],
        posterUrl: "https://picsum.photos/seed/senja/400/600",
        releaseDate: new Date("2026-06-01"),
      },
      {
        title: "The Last Heist",
        synopsis: "Perampokan terakhir yang berubah jadi kucing-kucingan mematikan.",
        durationMin: 130,
        rating: "17+",
        genres: ["Thriller", "Crime"],
        posterUrl: "https://picsum.photos/seed/heist/400/600",
        releaseDate: new Date("2026-06-10"),
      },
    ].map((m) => prisma.movie.create({ data: m }))
  );

  // Cinemas + auditoriums + seats
  const cinemaData = [
    { name: "CinePlex Grand Indonesia", city: "Jakarta", address: "Jl. M.H. Thamrin No.1", lat: -6.1951, lng: 106.8211 },
    { name: "CinePlex Paris Van Java", city: "Bandung", address: "Jl. Sukajadi No.137", lat: -6.8889, lng: 107.5953 },
  ];

  const auditoriums: { id: string; basePrice: number }[] = [];

  for (const c of cinemaData) {
    const cinema = await prisma.cinema.create({ data: c });
    for (let i = 1; i <= 2; i++) {
      const rows = 8;
      const cols = 12;
      const aud = await prisma.auditorium.create({
        data: {
          cinemaId: cinema.id,
          name: `Studio ${i}`,
          screenLabel: "LAYAR",
          rows,
          cols,
          seats: { create: buildSeats(rows, cols) },
        },
      });
      auditoriums.push({ id: aud.id, basePrice: 50000 + i * 5000 });
    }
  }

  // Showtimes: each movie in each auditorium across 3 days, a few slots/day.
  const slots = ["13:00", "16:00", "19:30"];
  const baseDay = new Date("2026-06-15T00:00:00");
  for (const aud of auditoriums) {
    for (let d = 0; d < 3; d++) {
      for (const movie of movies) {
        for (const slot of slots) {
          const [h, min] = slot.split(":").map(Number);
          const startsAt = new Date(baseDay);
          startsAt.setDate(startsAt.getDate() + d);
          startsAt.setHours(h, min, 0, 0);
          await prisma.showtime.create({
            data: {
              movieId: movie.id,
              auditoriumId: aud.id,
              startsAt,
              basePrice: aud.basePrice,
              priceMultiplier: slot === "19:30" ? 1.2 : 1.0, // prime time pricier
            },
          });
        }
      }
    }
  }

  console.log("Seed done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
