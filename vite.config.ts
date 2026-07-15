import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  // Relative assets work for both user and project GitHub Pages sites.
  base: './',
  plugins: [react()],
  test: {
    environment: 'node',
  },
})
