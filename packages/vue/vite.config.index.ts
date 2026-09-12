import { basename, join } from 'node:path';
import dts from 'unplugin-dts/vite';
import { defineConfig } from 'vite';

const pkgDir = import.meta.dirname;

export default defineConfig({
  logLevel: 'warn',
  root: pkgDir,
  plugins: [
    dts({
      processor: 'vue',
      tsconfigPath: join(pkgDir, 'tsconfig.json'),
      entryRoot: join(pkgDir, 'src'),
      outDirs: [join(pkgDir, 'dist'), join(pkgDir, 'dist', 'cjs')],
      aliases: [{ find: /\.vue$/, replacement: '.vue.js' }],
    }),
  ],
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
            id.endsWith('.vue') ? `./icons/${basename(id)}.js` : id,
        },
        {
          format: 'cjs',
          dir: join(pkgDir, 'dist', 'cjs'),
          entryFileNames: '[name].js',
          chunkFileNames: '_chunks/[name]-[hash].js',
          paths: (id) =>
            id.endsWith('.vue') ? `./icons/${basename(id)}.js` : id,
        },
      ],
    },
  },
});
