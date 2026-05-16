import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        landing: resolve(__dirname, 'index.html'),
        app:     resolve(__dirname, 'app.html'),
      },
      output: {
        manualChunks(id) {
          if (id.includes('@supabase'))  return 'vendor-supabase';
          if (id.includes('@tanstack'))  return 'vendor-query';
          if (id.includes('zustand'))    return 'vendor-zustand';
          if (id.includes('node_modules')) return 'vendor-react';
        },
      },
    },
  },
})
