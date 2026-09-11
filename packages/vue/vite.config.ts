import { readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

const srcDir = join(import.meta.dirname, 'src');
const iconEntries = Object.fromEntries(
  readdirSync(join(srcDir, 'icons'))
    .filter((file) => file.endsWith('.vue'))
    .map((file) => [`icons/${file}`, join(srcDir, 'icons', file)]),
);

const output = (format: 'es' | 'cjs', dir: string) => ({
  format,
  dir: join(import.meta.dirname, dir),
  entryFileNames: '[name].js',
  chunkFileNames: '_chunks/[name]-[hash].js',
  paths: (id: string) =>
    id.endsWith('.vue') ? `./icons/${basename(id)}.js` : id,
});

export default defineConfig(({ mode }) => {
  // Keep the barrel out of the icon graph so every icon remains its own compiled entry.
  const buildingIndex = mode === 'index';

  return {
    logLevel: 'warn',
    root: import.meta.dirname,
    plugins: [vue()],
    build: {
      copyPublicDir: false,
      emptyOutDir: false,
      lib: {
        entry: buildingIndex
          ? { index: join(srcDir, 'index.ts') }
          : iconEntries,
      },
      minify: false,
      reportCompressedSize: false,
      rolldownOptions: {
        external: buildingIndex
          ? (id) => id === 'vue' || id.endsWith('.vue')
          : ['vue'],
        output: [output('es', 'dist'), output('cjs', 'dist/cjs')],
      },
    },
  };
});
