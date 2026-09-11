import {
  cpSync,
  mkdirSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { basename, join } from 'node:path';
import vue from '@vitejs/plugin-vue';
import { $ } from 'bun';
import { build, type InlineConfig } from 'vite';
import { convertIconToVueSvg } from './codegen.ts';
import { scanIcons, type IconDef } from './lib.ts';
import { renderTemplate, renderVueTemplate } from './template.ts';

const pkgDir = join(import.meta.dir, '..', 'packages', 'vue');
const srcDir = join(pkgDir, 'src');
const iconsDir = join(srcDir, 'icons');
const distDir = join(pkgDir, 'dist');

const output = (format: 'es' | 'cjs', dir: string) => ({
  format,
  dir: join(pkgDir, dir),
  entryFileNames: '[name].js',
  chunkFileNames: '_chunks/[name]-[hash].js',
  paths: (id: string) =>
    id.endsWith('.vue') ? `./icons/${basename(id)}.js` : id,
});

// Keep the barrel out of the icon graph so every icon remains its own compiled entry.
function createViteConfig(target: 'icons' | 'index'): InlineConfig {
  const buildingIndex = target === 'index';
  const iconEntries = Object.fromEntries(
    readdirSync(iconsDir)
      .filter((file) => file.endsWith('.vue'))
      .map((file) => [`icons/${file}`, join(iconsDir, file)]),
  );

  return {
    configFile: false,
    mode: 'production',
    logLevel: 'warn',
    root: pkgDir,
    plugins: [vue()],
    build: {
      copyPublicDir: false,
      emptyOutDir: false,
      lib: {
        entry: buildingIndex ? { index: join(srcDir, 'index.ts') } : iconEntries,
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
}

async function iconComponent(def: IconDef): Promise<string> {
  return renderVueTemplate('vue-icon.vue.template', {
    componentName: def.pascalName,
    svg: convertIconToVueSvg(def),
  });
}

const icons = scanIcons();

rmSync(srcDir, { recursive: true, force: true });
mkdirSync(iconsDir, { recursive: true });

const exports: string[] = [];
for (const def of icons) {
  writeFileSync(
    join(iconsDir, `${def.pascalName}.vue`),
    await iconComponent(def),
  );
  exports.push(
    renderTemplate('vue-icon-exports.ts.template', {
      componentName: def.pascalName,
    }).trim(),
  );
}
writeFileSync(join(srcDir, 'index.ts'), `${exports.join('\n')}\n`);

rmSync(distDir, { recursive: true, force: true });
await build(createViteConfig('icons'));
await build(createViteConfig('index'));
await $`bunx vue-tsc --project ${join(pkgDir, 'tsconfig.json')} --noEmit false --noEmitOnError --emitDeclarationOnly --declaration --rootDir ${srcDir} --outDir ${distDir}`;

cpSync(join(distDir, 'index.d.ts'), join(distDir, 'cjs', 'index.d.ts'));
cpSync(join(distDir, 'icons'), join(distDir, 'cjs', 'icons'), {
  recursive: true,
  filter: (source) => !source.endsWith('.js'),
});
writeFileSync(join(distDir, 'cjs', 'package.json'), '{"type":"commonjs"}\n');
console.log(`vue: ${icons.length} icon components built`);
