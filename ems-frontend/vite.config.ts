import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), ['BACKEND_API_URL', 'DEV_PORT'])
  const backendApiUrl = env.BACKEND_API_URL?.trim().replace(/\/+$/, '')

  if (command === 'serve' && !backendApiUrl) {
    throw new Error('Set BACKEND_API_URL in .env.local (see .env.example).')
  }

  return {
    plugins: [react()],
    server: {
      port: Number(env.DEV_PORT || 4200),
      proxy: backendApiUrl ? {
        '/api': {
          target: backendApiUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api(?=\/|\?|$)/, ''),
        },
      } : undefined,
    },
  }
})
