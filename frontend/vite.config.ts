/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Puerto fijo en 3000: el backend (backend/src/index.ts) tiene el CORS
    // hardcodeado a http://localhost:3000, así que se mantiene el mismo
    // puerto que usaba Create React App para no tener que tocarlo.
    port: 3000,
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
