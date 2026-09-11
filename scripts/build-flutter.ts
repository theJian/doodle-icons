import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { flutterSvg, scanIcons, type IconDef } from './lib.ts';

const pkgDir = join(import.meta.dir, '..', 'packages', 'flutter');
const libDir = join(pkgDir, 'lib');
const srcDir = join(libDir, 'src');

function iconTemplate(name: string, svg: string): string {
  return `import 'package:flutter/widgets.dart' as widgets;
import 'package:flutter_svg/flutter_svg.dart';

class ${name} extends widgets.StatelessWidget {
  final widgets.Color? color;
  final double? width;
  final double? height;

  const ${name}({super.key, this.color, this.width, this.height});

  @override
  widgets.Widget build(widgets.BuildContext context) => SvgPicture.string(
    '''
${svg}''',
    colorFilter: color != null
        ? widgets.ColorFilter.mode(color!, widgets.BlendMode.srcIn)
        : null,
    width: width,
    height: height,
  );
}
`;
}

const icons: IconDef[] = scanIcons();

rmSync(libDir, { recursive: true, force: true });
mkdirSync(srcDir, { recursive: true });

const exports: string[] = [];
for (const def of icons) {
  writeFileSync(join(srcDir, `${def.snakeName}.dart`), iconTemplate(def.pascalName, flutterSvg(def)));
  exports.push(`export 'src/${def.snakeName}.dart';`);
}
writeFileSync(join(libDir, 'doodle_icons.dart'), `${exports.join('\n')}\n`);

console.log(`flutter: ${icons.length} dart icon widgets built`);
