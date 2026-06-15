import "dotenv/config";

function req(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined) throw new Error(`Missing env var: ${name}`);
  return v;
}

export const config = {
  port: Number(req("PORT", "4000")),
  webOrigin: req("WEB_ORIGIN", "http://localhost:3000"),
  jwt: {
    accessSecret: req("JWT_ACCESS_SECRET"),
    refreshSecret: req("JWT_REFRESH_SECRET"),
    accessTtl: req("ACCESS_TOKEN_TTL", "15m"),
    refreshTtl: req("REFRESH_TOKEN_TTL", "7d"),
  },
  seatLockTtlSec: Number(req("SEAT_LOCK_TTL_SEC", "300")),
  bookingHoldTtlSec: Number(req("BOOKING_HOLD_TTL_SEC", "600")),
};
