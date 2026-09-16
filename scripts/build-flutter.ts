import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { convertIconToFlutterSvg } from './codegen.ts';
import { scanIcons, type IconDef } from './lib.ts';
import { renderTemplate } from './template.ts';

const pkgDir = join(import.meta.dir, '..', 'packages', 'flutter');
const libDir = join(pkgDir, 'lib');
const srcDir = join(libDir, 'src');

function iconComponent(def: IconDef): string {
  return renderTemplate('flutter-icon.dart.template', {
    componentName: def.pascalName,
    svg: convertIconToFlutterSvg(def),
  });
}

const icons = scanIcons();

rmSync(libDir, { recursive: true, force: true });
mkdirSync(srcDir, { recursive: true });

const exports: string[] = [];
for (const def of icons) {
  writeFileSync(join(srcDir, `${def.snakeName}.dart`), iconComponent(def));
  exports.push(
    renderTemplate('flutter-icon-exports.dart.template', {
      snakeName: def.snakeName,
    }).trim(),
  );
}
writeFileSync(join(libDir, 'doodle_icons.dart'), `${exports.join('\n')}\n`);

console.log(`flutter: ${icons.length} dart icon widgets built`);
