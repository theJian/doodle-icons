import { basename, join } from 'node:path';
import { defineConfig } from 'vite';

const pkgDir = import.meta.dirname;

export default defineConfig({
  logLevel: 'warn',
  root: pkgDir,
  build: {
    copyPublicDir: false,
    emptyOutDir: false,
    lib: {
      entry: { index: join(pkgDir, 'src', 'index.ts') },
    },
    minify: false,
    reportCompressedSize: false,
    rolldownOptions: {
      external: (id) => id === 'vue' || id.endsWith('.vue'),
      output: [
        {
          format: 'es',
          dir: join(pkgDir, 'dist'),
          entryFileNames: '[name].js',
          chunkFileNames: '_chunks/[name]-[hash].js',
          paths: (id) =>
            id.endsWith('.vue')
              ? `./icons/${basename(id, '.vue')}.js`
              : id,
        },
        {
          format: 'cjs',
          dir: join(pkgDir, 'dist', 'cjs'),
          entryFileNames: '[name].js',
          chunkFileNames: '_chunks/[name]-[hash].js',
          paths: (id) =>
            id.endsWith('.vue')
              ? `./icons/${basename(id, '.vue')}.js`
              : id,
        },
      ],
    },
  },
});
