// ecosystem.config.cjs
const path = require('path');

module.exports = {
  apps: [
    {
      name: 'ai-backend',
      script: 'cmd.exe',
      args: '/c python app.py',
      cwd: 'C:\\Users\\STAS888\\PycharmProjects\\ai_agent_workspace\\ai_agent_workspace\\src',
      interpreter: 'none',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      time: true,
      windowsHide: false,
      exec_mode: 'fork'
    },
    {
      name: 'ai-frontend',
      // Вариант 1: Для Vite (если используется vite)
      script: 'npm.cmd',  // На Windows используем npm.cmd
      args: 'run dev',

      // Вариант 2: Для Create React App
      // script: 'cmd.exe',
      // args: '/c npm run dev',

      cwd: 'C:\\Users\\STAS888\\PycharmProjects\\ai_agent_workspace\\ai_agent_workspace', // Укажите путь к папке с package.json фронтенда
      interpreter: 'none',
      env: {
        PORT: 5716,
        BROWSER: 'none',  // Отключаем автоматическое открытие браузера
        NODE_ENV: 'development'
      },
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      time: true,
      windowsHide: false,
      exec_mode: 'fork',
      // Дополнительные опции для Node.js приложений
      node_args: '--max-old-space-size=1024'
    }
  ]
};