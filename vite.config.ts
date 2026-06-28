import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  // viteSingleFile inlines the JS + CSS into a single dist/index.html, so the
  // production build is one self-contained file you can double-click or share
  // (fits the no-backend ethos). The Tabler icon font still loads from its CDN.
  plugins: [react(), viteSingleFile()],
  // Honor a PORT env var (e.g. from the preview tool) so the dev server lands
  // on the expected port; fall back to Vite's default otherwise.
  server: process.env.PORT ? { port: Number(process.env.PORT) } : undefined,
  preview: process.env.PORT ? { port: Number(process.env.PORT) } : undefined,
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
