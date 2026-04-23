import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // BUG FIX: Added server configuration to ensure consistent port handling 
  // and host resolution for Firebase/API communication.
  server: {
    port: 5173,
    host: true, // Allows access on local network for testing on mobile devices
    strictPort: true,
  },
  build: {
    // BUG FIX: Ensures the dist folder is wiped clean before every new build
    // This prevents old exam papers or outdated code from breaking the site.
    emptyOutDir: true,
    // Ensures clean builds for your PYQP production deployment
    outDir: 'dist',
    sourcemap: false,
  }
})