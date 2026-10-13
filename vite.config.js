import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
  build: { assetsInlineLimit: Infinity, cssCodeSplit: false, target: 'es2020' },
});
