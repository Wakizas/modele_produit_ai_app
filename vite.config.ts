import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // FIX: Expose API_KEY to the client-side code as process.env.API_KEY to align with Gemini API guidelines.
  // This reads the API_KEY from the build environment and makes it available in the app.
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
})
