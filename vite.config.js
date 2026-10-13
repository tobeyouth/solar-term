import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig(({ mode }) => {
  const online = mode === 'release';
  return {
    base: './',
    plugins: online ? [] : [viteSingleFile()],
    build: {
      outDir: online ? 'release' : 'dist',
      assetsInlineLimit: online ? 0 : Infinity,
      cssCodeSplit: online,
      target: 'es2020',
      ...(online && {
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (id.includes('/node_modules/astronomy-engine/')) return 'astronomy';
              if (id.includes('/node_modules/lucide/')) return 'icons';
            },
          },
        },
      }),
    },
  };
});
