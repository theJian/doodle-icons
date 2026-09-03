import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { $ } from 'bun';
import { scanIcons, uniquifyIds, type IconDef, type IconNode } from './lib.ts';

const pkgDir = join(import.meta.dir, '..', 'packages', 'react-native');
const srcDir = join(pkgDir, 'src');
const iconsDir = join(srcDir, 'icons');

const RN_TAGS: Record<string, string> = {
  path: 'Path',
  g: 'G',
  defs: 'Defs',
  clipPath: 'ClipPath',
  rect: 'Rect',
};

const RN_ATTRS: Record<string, string> = {
  'clip-path': 'clipPath',
  'clip-rule': 'clipRule',
  'fill-rule': 'fillRule',
  'fill-opacity': 'fillOpacity',
  'stroke-width': 'strokeWidth',
  'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin',
};

function toRnJsx(node: IconNode, indent: string, inDefs: boolean): string {
  const tag = RN_TAGS[node.tag] ?? node.tag;
  const attrs = Object.entries(node.attrs)
    .filter(([k]) => !k.startsWith('xmlns'))
    .map(([k, v]) => {
      const name = RN_ATTRS[k] ?? k;
      const value = !inDefs && k === 'fill' && v === 'currentColor' ? '{color}' : `"${v}"`;
      return `${name}=${value}`;
    })
    .join(' ');
  const childDefs = inDefs || node.tag === 'defs' || node.tag === 'clipPath';
  if (node.children.length === 0) {
    return `${indent}<${tag}${attrs ? ` ${attrs}` : ''} />`;
  }
  const children = node.children.map((c) => toRnJsx(c, `${indent}  `, childDefs)).join('\n');
  return `${indent}<${tag}${attrs ? ` ${attrs}` : ''}>\n${children}\n${indent}</${tag}>`;
}

function iconComponent(def: IconDef): string {
  uniquifyIds(def.nodes, def.pascalName);
  const used = new Set<string>(['Svg']);
  const collect = (nodes: IconNode[]) => {
    for (const n of nodes) {
      const tag = RN_TAGS[n.tag];
      if (!tag) throw new Error(`Unhandled SVG element <${n.tag}> in ${def.category}/${def.kebabName}.svg`);
      used.add(tag);
      collect(n.children);
    }
  };
  collect(def.nodes);
  const imports = [...used].sort().join(', ');
  const inner = def.nodes.map((n) => toRnJsx(n, '      ', false)).join('\n');
  return `import * as React from 'react';
import { ${imports} } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';

export type ${def.pascalName}Props = Omit<SvgProps, 'fill'> & {
  size?: number | string;
  color?: string;
};

export const ${def.pascalName} = function ${def.pascalName}(props: ${def.pascalName}Props) {
  const { size = 24, color = '#000000', ...rest } = props;
  return (
    <Svg viewBox="${def.viewBox}" width={size} height={size} {...rest}>
${inner}
    </Svg>
  );
};
`;
}

const icons = scanIcons();

rmSync(srcDir, { recursive: true, force: true });
mkdirSync(iconsDir, { recursive: true });

const exports: string[] = [];
for (const def of icons) {
  writeFileSync(join(iconsDir, `${def.pascalName}.tsx`), iconComponent(def));
  exports.push(
    `export { ${def.pascalName}, type ${def.pascalName}Props } from './icons/${def.pascalName}.js';`,
    `export { ${def.pascalName} as ${def.pascalName}Icon } from './icons/${def.pascalName}.js';`,
  );
}
writeFileSync(join(srcDir, 'index.ts'), `${exports.join('\n')}\n`);

await $`bun x tsup`.cwd(pkgDir).quiet();
console.log(`react-native: ${icons.length} icon components built`);
