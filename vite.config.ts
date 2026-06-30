/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

// Fuer GitHub Pages wird base auf den Repo-Unterpfad gesetzt.
// Der Deploy-Workflow setzt GITHUB_PAGES=true.
const base = process.env.GITHUB_PAGES === 'true' ? '/spatial-audio-canvas/' : '/';

export default defineConfig({
  base,
  build: {
    target: 'es2022',
    sourcemap: true,
  },
  server: {
    port: 5173,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});