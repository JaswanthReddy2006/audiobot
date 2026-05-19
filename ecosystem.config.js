// PM2 ecosystem config — run this on your EC2 instance
module.exports = {
  apps: [
    {
      name: "nova-backend",
      script: "./backend/server.js",
      cwd: "./", // Use relative path so it works wherever deployed
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 5000,
      },
    },
  ],
};
