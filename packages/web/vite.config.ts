import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    rollupOptions: {
      output: {
        format: 'iife',
      },
    },
    modulePreload: {
      polyfill: false,
    },
  },
  server: {
    port: 5173,
    strictPort: false,
  },
})
