# cinema-tix

PWA cinema ticketing — login, pilih film/bioskop/jadwal, pilih kursi (realtime lock), 3D POV view, checkout (mock pay).

## Stack
- **web**: Next.js (App Router) + PWA + react-three-fiber (3D seat POV)
- **api**: Express + Prisma + Socket.IO + Postgres
- **shared**: TS DTO types

## Dev setup

```bash
npm install
npm run db:up                  # start postgres (docker, port 5433)
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
npm run db:migrate             # prisma migrate
npm run db:seed                # seed movies/cinemas/showtimes/seats
npm run dev                    # api :4000 + web :3000
```

Login seed user: `demo@cinema.test` / `password123`

### Postgres options
- **Docker** (default, port 5433): `npm run db:up`. `.env.example` points here.
- **Local Postgres** (port 5432): create role+db, then set
  `DATABASE_URL="postgresql://cinema:cinema@localhost:5432/cinema_tix?schema=public"`
  in `apps/api/.env`. Role needs `CREATEDB` (Prisma shadow db):
  ```sql
  CREATE ROLE cinema LOGIN PASSWORD 'cinema' CREATEDB;
  CREATE DATABASE cinema_tix OWNER cinema;
  ```

> Dev verified against local Postgres 16 — the current `apps/api/.env` already
> points at port 5432.

## Production / Deploy

- **Live**: web https://cinema.ryanprayoga.dev · API https://cinema-api.ryanprayoga.dev
- **Host**: Oracle VPS (`/home/ubuntu/projects/cinema-tix`), Caddy reverse proxy, PM2.
- **Ports**: API `127.0.0.1:4202`, web `127.0.0.1:4203`.
- **DB**: VPS-local Postgres `cinema_tix_db` (API connects to `localhost:5432` on the VPS — no tunnel there).
- **CI/CD**: push to `main` → `.github/workflows/deploy.yml` → SSH (appleboy) → pull, install, prisma migrate deploy, build web, `pm2 startOrReload`, healthcheck.
  - Repo secrets: `SERVER_HOST`, `SERVER_DEPLOY_KEY`.
- **Server env (not committed)**:
  - `apps/api/.env`: `DATABASE_URL=postgresql://postgres:***@localhost:5432/cinema_tix_db`, JWT secrets, `PORT=4202`, `WEB_ORIGIN=https://cinema.ryanprayoga.dev`.
  - `apps/web/.env.local`: `NEXT_PUBLIC_API_URL=https://cinema-api.ryanprayoga.dev` (baked at build).

## Verified end-to-end
auth · catalog · seat map (status+price) · booking hold → double-book 409 →
mock pay → seats booked · realtime seat-lock broadcast (2 clients) · web prod
build (PWA + 3D route).
