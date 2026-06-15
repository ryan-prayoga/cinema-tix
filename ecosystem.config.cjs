// PM2 process config for the VPS.
// Secrets/DB creds are NOT here — the API reads apps/api/.env (dotenv) and the
// web build bakes apps/web/.env.local at build time. PM2 only sets ports/NODE_ENV.
module.exports = {
  apps: [
    {
      name: "cinema-tix-api",
      cwd: "/home/ubuntu/projects/cinema-tix/apps/api",
      script: "../../node_modules/.bin/tsx",
      args: "src/index.ts",
      interpreter: "none",
      env: {
        NODE_ENV: "production",
        PORT: 4202,
      },
    },
    {
      name: "cinema-tix-web",
      cwd: "/home/ubuntu/projects/cinema-tix/apps/web",
      script: "../../node_modules/.bin/next",
      args: "start",
      interpreter: "none",
      env: {
        NODE_ENV: "production",
        PORT: 4203,
      },
    },
  ],
};
