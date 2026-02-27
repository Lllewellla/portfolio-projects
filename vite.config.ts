import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // относительная база, чтобы бандл корректно работал
  // и локально, и на GitHub Pages под /portfolio-projects/
  base: './',
})
