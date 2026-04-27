import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@supabase'))          return 'vendor-supabase';
          if (id.includes('@tanstack'))           return 'vendor-query';
          if (id.includes('zustand'))             return 'vendor-zustand';
          if (id.includes('node_modules'))        return 'vendor-react';
        },
      },
    },
  },
})
