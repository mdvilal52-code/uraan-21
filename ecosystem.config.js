// PM2 process definition for running the Next.js standalone build on a VPS
// (Ubuntu, Hostinger, DigitalOcean, AWS, etc.) behind Nginx/Apache.
//
//   npm ci && npm run build
//   pm2 start ecosystem.config.js && pm2 save
//
// `next build` with output:'standalone' emits .next/standalone/server.js — a
// self-contained Node server. Copy the static assets next to it once after each
// build (the postbuild step below documents the two folders it needs):
//   cp -r .next/static .next/standalone/.next/static
//   cp -r public       .next/standalone/public
module.exports = {
  apps: [
    {
      name: 'om-gauri-putra',
      script: '.next/standalone/server.js',
      instances: 'max', // one worker per CPU core
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
        NEXT_TELEMETRY_DISABLED: '1',
      },
      max_memory_restart: '512M',
    },
  ],
};
