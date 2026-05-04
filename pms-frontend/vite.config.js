import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  /*
  =========================
  ==== PRODUCTION (HOSTINGER) ====
  For production build, server config is not used
  Build command: npm run build
  Deploy the 'dist' folder to Hostinger
  =========================
  */
  
  /*
  =========================
  ==== LOCAL (REMOVE FOR PROD) ====
  REMOVE OR COMMENT THIS FOR PRODUCTION
  =========================
  */
  server: {
    port: 3000,  // LOCAL ONLY - development server port
  },
})
