import { readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

const pkgDir = import.meta.dirname;
const iconsDir = join(pkgDir, 'src', 'icons');

export default defineConfig({
  logLevel: 'warn',
  root: pkgDir,
  plugins: [vue()],
  build: {
    copyPublicDir: false,
    emptyOutDir: false,
    lib: {
      entry: Object.fromEntries(
        readdirSync(iconsDir)
          .filter((file) => file.endsWith('.vue'))
          .map((file) => [
            `icons/${basename(file, '.vue')}`,
            join(iconsDir, file),
          ]),
      ),
    },
    minify: false,
    reportCompressedSize: false,
    rolldownOptions: {
      external: ['vue'],
      output: [
        {
          format: 'es',
          dir: join(pkgDir, 'dist'),
          entryFileNames: '[name].js',
          chunkFileNames: '_chunks/[name]-[hash].js',
        },
        {
          format: 'cjs',
          dir: join(pkgDir, 'dist', 'cjs'),
          entryFileNames: '[name].js',
          chunkFileNames: '_chunks/[name]-[hash].js',
        },
      ],
    },
  },
});
