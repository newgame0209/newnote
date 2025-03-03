import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ['fabric']
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          fabric: ['fabric']
        }
      }
    }
  },
  define: {
    'process.env.VITE_NOTE_API_URL': JSON.stringify('https://newnote-backend.onrender.com/api'),
    'process.env.VITE_MEMO_API_URL': JSON.stringify('https://memo-backend-7va4.onrender.com/api')
  }
})
