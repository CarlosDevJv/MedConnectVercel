import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  /** Garante `index.html` e `.env.local` sempre relativos à pasta deste projeto, mesmo se o comando for iniciado em outro cwd. */
  root: path.resolve(__dirname),
  envDir: path.resolve(__dirname),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
