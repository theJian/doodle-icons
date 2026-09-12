import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildPackage } from './build-package.ts';
import { convertIconToJsx } from './codegen.ts';
import { scanIcons, type IconDef } from './lib.ts';
import { renderTemplate, renderTypeScriptTemplate } from './template.ts';

const pkgDir = join(import.meta.dir, '..', 'packages', 'react-native');
const srcDir = join(pkgDir, 'src');
const iconsDir = join(srcDir, 'icons');

async function iconComponent(def: IconDef): Promise<string> {
  const { jsx, components } = convertIconToJsx(def, 'react-native-svg', {
    width: '{size}',
    height: '{size}',
    color: '{color}',
    '{...props}': null,
  });
  return renderTypeScriptTemplate('react-native-icon.tsx.template', {
    componentName: def.pascalName,
    components: components.sort().join(', '),
    jsx,
  });
}

const icons = scanIcons();

rmSync(srcDir, { recursive: true, force: true });
mkdirSync(iconsDir, { recursive: true });
writeFileSync(
  join(srcDir, 'context.tsx'),
  await renderTypeScriptTemplate('react-native-context.tsx.template'),
);

const exports: string[] = [];
for (const def of icons) {
  writeFileSync(join(iconsDir, `${def.pascalName}.tsx`), await iconComponent(def));
  exports.push(renderTemplate('icon-exports.ts.template', { componentName: def.pascalName }).trim());
}
writeFileSync(
  join(srcDir, 'index.ts'),
  await renderTypeScriptTemplate('react-native-index.ts.template', { iconExports: exports.join('\n') }),
);

await buildPackage(pkgDir);
console.log(`react-native: ${icons.length} icon components built`);
