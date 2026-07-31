import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    // Polyfill Node.js 'global' for browser dependencies (buffer, ledger, etc.)
    global: 'globalThis',
  },
  resolve: {
    preserveSymlinks: true,
    alias: {
      // Polyfill Node.js 'buffer' for browser (used by stellar-sdk)
      buffer: 'buffer/',
    },
  },
  optimizeDeps: {
    include: ['@creit.tech/stellar-wallets-kit', 'buffer'],
  },
})
