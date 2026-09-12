import { readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

const pkgDir = import.meta.dirname;
const srcDir = join(pkgDir, 'src');
const iconsDir = join(srcDir, 'icons');

const output = (format: 'es' | 'cjs', dir: string) => ({
  format,
  dir: join(pkgDir, dir),
  entryFileNames: '[name].js',
  chunkFileNames: '_chunks/[name]-[hash].js',
  paths: (id: string) =>
    id.endsWith('.vue') ? `./icons/${basename(id)}.js` : id,
});

export function createVueConfig(target: 'icons' | 'index') {
  const buildingIndex = target === 'index';
  const entry = buildingIndex
    ? { index: join(srcDir, 'index.ts') }
    : Object.fromEntries(
        readdirSync(iconsDir)
          .filter((file) => file.endsWith('.vue'))
          .map((file) => [`icons/${file}`, join(iconsDir, file)]),
      );

  return defineConfig({
    logLevel: 'warn',
    root: pkgDir,
    plugins: [vue()],
    build: {
      copyPublicDir: false,
      emptyOutDir: false,
      lib: { entry },
      minify: false,
      reportCompressedSize: false,
      rolldownOptions: {
        external: buildingIndex
          ? (id) => id === 'vue' || id.endsWith('.vue')
          : ['vue'],
        output: [output('es', 'dist'), output('cjs', 'dist/cjs')],
      },
    },
  });
}
