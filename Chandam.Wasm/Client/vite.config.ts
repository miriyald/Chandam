import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: 'localhost',
    port: 5050,
    strictPort: true
  },
  build: {
    outDir: '../wwwroot/js',
    emptyOutDir: true,
    rollupOptions: {
      input: 'src/main.ts',
      output: {
        entryFileNames: 'chandam-app.js',
        format: 'es'
      }
    }
  }
});
