import type { SeatType } from "@cinema-tix/shared";

// Seat type modifier applied on top of showtime base price.
const SEAT_TYPE_MODIFIER: Record<SeatType, number> = {
  REGULAR: 1.0,
  PREMIUM: 1.5,
  DISABLED: 1.0,
};

// Always compute price on the server — never trust the client.
export function seatPrice(
  basePrice: number,
  priceMultiplier: number,
  seatType: SeatType
): number {
  return Math.round(basePrice * priceMultiplier * SEAT_TYPE_MODIFIER[seatType]);
}
