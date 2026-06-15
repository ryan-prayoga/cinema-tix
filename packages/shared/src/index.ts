// Shared DTO types used by both web and api.

export type SeatType = "REGULAR" | "PREMIUM" | "DISABLED";
export type SeatStatus = "available" | "booked" | "locked" | "selected";
export type MovieStatus = "NOW_SHOWING" | "COMING_SOON" | "ARCHIVED";
export type BookingStatus = "PENDING" | "PAID" | "CANCELLED" | "EXPIRED";
export type UserRole = "USER" | "ADMIN";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface Movie {
  id: string;
  title: string;
  synopsis: string;
  durationMin: number;
  posterUrl: string;
  rating: string;
  genres: string[];
  releaseDate: string;
  status: MovieStatus;
}

export interface Cinema {
  id: string;
  name: string;
  city: string;
  address: string;
  lat: number | null;
  lng: number | null;
}

export interface Showtime {
  id: string;
  movieId: string;
  auditoriumId: string;
  startsAt: string;
  basePrice: number;
  priceMultiplier: number;
  movie?: Movie;
  cinema?: Cinema;
  auditoriumName?: string;
}

export interface SeatDTO {
  id: string;
  rowLabel: string;
  colNumber: number;
  type: SeatType;
  x: number;
  y: number;
  z: number;
  status: SeatStatus;
  price: number;
}

export interface SeatMapResponse {
  showtime: Showtime;
  auditorium: {
    id: string;
    name: string;
    screenLabel: string;
    rows: number;
    cols: number;
  };
  seats: SeatDTO[];
}

export interface BookingSeatDTO {
  seatId: string;
  rowLabel: string;
  colNumber: number;
  price: number;
}

export interface BookingDTO {
  id: string;
  showtimeId: string;
  status: BookingStatus;
  totalPrice: number;
  createdAt: string;
  expiresAt: string | null;
  seats: BookingSeatDTO[];
  showtime?: Showtime;
}

// Socket.IO event payloads
export interface SeatLockPayload {
  showtimeId: string;
  seatId: string;
}
export interface SeatLockedEvent {
  seatId: string;
  byUserId: string;
}
export interface SeatBookedEvent {
  seatIds: string[];
}
