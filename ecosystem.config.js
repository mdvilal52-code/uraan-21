// PM2 process configuration — works on any Linux / macOS server.
// Start:   pm2 start ecosystem.config.js --env production
// Save:    pm2 save
// Startup: pm2 startup  (follow the printed command to enable auto-start)
// Logs:    pm2 logs om-gauri-putra
// Status:  pm2 status

module.exports = {
  apps: [
    {
      name: 'om-gauri-putra',

      // Standard npm start — no provider-specific command
      script: 'node_modules/.bin/next',
      args: 'start',

      // Use all CPU cores in cluster mode for maximum throughput
      instances: 'max',
      exec_mode: 'cluster',

      watch: false,
      max_memory_restart: '1G',

      // Graceful restart: wait for in-flight requests to finish
      kill_timeout: 5000,
      listen_timeout: 10000,
      wait_ready: true,

      // Automatically restart on crash, with exponential backoff
      autorestart: true,
      min_uptime: '10s',
      max_restarts: 10,

      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      // Write logs to local files (rotate with pm2-logrotate)
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
