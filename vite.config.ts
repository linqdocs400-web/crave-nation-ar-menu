import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'three/addons/': 'three/examples/jsm/',
    },
  },
  build: {
    // keep the MindAR wasm/js chunk readable in dev tools and skip sourcemaps for size
    chunkSizeWarningLimit: 1400,
  },
})
