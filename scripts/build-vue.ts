import {
  cpSync,
  mkdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
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
const viteConfig = join(pkgDir, 'vite.config.ts');
await build({ configFile: viteConfig, mode: 'icons' });
await build({ configFile: viteConfig, mode: 'index' });
await $`node ${fileURLToPath(import.meta.resolve('vue-tsc/bin/vue-tsc.js'))} --project ${join(pkgDir, 'tsconfig.build.json')}`;

cpSync(join(distDir, 'index.d.ts'), join(distDir, 'cjs', 'index.d.ts'));
cpSync(join(distDir, 'icons'), join(distDir, 'cjs', 'icons'), {
  recursive: true,
  filter: (source) => !source.endsWith('.js'),
});
writeFileSync(join(distDir, 'cjs', 'package.json'), '{"type":"commonjs"}\n');
console.log(`vue: ${icons.length} icon components built`);
