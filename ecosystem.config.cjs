// PM2 — processo da API em produção (servidor).
// Node 24 roda o TypeScript direto via tsx (`--import tsx`); `--env-file`
// carrega packages/api/.env. Ajuste os caminhos se o servidor mudar.
module.exports = {
  apps: [
    {
      name: 'devocional-api',
      cwd: '/var/www/vitor/devocional/packages/api',
      script: 'src/index.ts',
      interpreter: '/root/.nvm/versions/node/v24.16.0/bin/node',
      interpreter_args: '--import tsx --env-file=.env',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      max_memory_restart: '400M',
    },
  ],
};
