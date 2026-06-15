import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  // Never cache the live seat map — it must always be fresh.
  runtimeCaching: [
    {
      urlPattern: /\/showtimes\/.*\/seats/,
      handler: "NetworkOnly",
    },
    {
      urlPattern: /\/(movies|cinemas)/,
      handler: "StaleWhileRevalidate",
      options: { cacheName: "catalog" },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@cinema-tix/shared"],
};

export default withPWA(nextConfig);
