import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { $ } from 'bun';
import { build } from 'vite';
import { convertIconToVueSvg } from './codegen.ts';
import { scanIcons, type IconDef } from './lib.ts';
import { renderTemplate, renderVueTemplate } from './template.ts';

const pkgDir = join(import.meta.dir, '..', 'packages', 'vue');
const srcDir = join(pkgDir, 'src');
const iconsDir = join(srcDir, 'icons');
const distDir = join(pkgDir, 'dist');

async function iconComponent(def: IconDef): Promise<string> {
  return renderVueTemplate('vue-icon.vue.template', {
    componentName: def.pascalName,
    svg: convertIconToVueSvg(def),
  });
}

function iconExports(def: IconDef, moduleExtension: string): string {
  return renderTemplate('vue-icon-exports.ts.template', {
    componentName: def.pascalName,
    moduleExtension,
  }).trim();
}

const icons = scanIcons();

rmSync(srcDir, { recursive: true, force: true });
mkdirSync(iconsDir, { recursive: true });

const sourceExports: string[] = [];
const declarationExports: string[] = [];
for (const def of icons) {
  writeFileSync(
    join(iconsDir, `${def.pascalName}.vue`),
    await iconComponent(def),
  );
  sourceExports.push(iconExports(def, '.vue'));
  declarationExports.push(iconExports(def, '.vue.js'));
}
writeFileSync(join(srcDir, 'index.ts'), `${sourceExports.join('\n')}\n`);
const declarationIndex = `${declarationExports.join('\n')}\n`;

rmSync(distDir, { recursive: true, force: true });
await build({ configFile: join(pkgDir, 'vite.config.icons.ts') });
await build({ configFile: join(pkgDir, 'vite.config.index.ts') });
for (const format of ['esm', 'cjs'] as const) {
  const outDir = format === 'esm' ? distDir : join(distDir, 'cjs');
  const module = format === 'esm' ? 'ESNext' : 'CommonJS';
  const resolution = format === 'esm' ? 'bundler' : 'node';
  await $`bunx vue-tsc --project ${join(pkgDir, 'tsconfig.json')} --noEmit false --noEmitOnError --emitDeclarationOnly --declaration --rootDir ${srcDir} --outDir ${outDir} --module ${module} --moduleResolution ${resolution}`;
  writeFileSync(join(outDir, 'index.d.ts'), declarationIndex);
}
writeFileSync(join(distDir, 'cjs', 'package.json'), '{"type":"commonjs"}\n');
console.log(`vue: ${icons.length} icon components built`);
