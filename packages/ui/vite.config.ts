import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base is './' so all asset paths are relative — required when served
// from state-watcher's HTTP server at an arbitrary prefix.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
