module.exports = {
  apps: [
    {
      name: "whymeal",
      script: "npm",
      args: "start",
      cwd: "/var/www/whymeal/2025OSSIHC_ZeroOne", // 프로젝트 경로
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
}