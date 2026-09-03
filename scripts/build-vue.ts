import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { $ } from 'bun';
import { scanIcons, uniquifyIds, type IconDef, type IconNode } from './lib.ts';

const pkgDir = join(import.meta.dir, '..', 'packages', 'vue');
const srcDir = join(pkgDir, 'src');
const iconsDir = join(srcDir, 'icons');

function toH(node: IconNode, indent: string): string {
  const attrs = Object.entries(node.attrs)
    .map(([k, v]) => {
      const key = k.includes('-') ? `'${k}'` : k;
      return `${key}: '${v.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
    })
    .join(', ');
  if (node.children.length === 0) {
    return `${indent}h('${node.tag}', { ${attrs} })`;
  }
  const children = node.children.map((c) => toH(c, `${indent}  `)).join(',\n');
  return `${indent}h('${node.tag}', { ${attrs} }, [\n${children},\n${indent}])`;
}

function iconComponent(def: IconDef): string {
  uniquifyIds(def.nodes, def.pascalName);
  const inner = def.nodes.map((n) => toH(n, '        ')).join(',\n');
  return `import { defineComponent, h, type SVGAttributes } from 'vue';

export type ${def.pascalName}Props = SVGAttributes & {
  size?: number | string;
  color?: string;
};

export const ${def.pascalName} = defineComponent({
  name: '${def.pascalName}',
  props: {
    size: { type: [Number, String], default: 24 },
    color: { type: String, default: 'currentColor' },
  },
  setup(props, { attrs }) {
    return () =>
      h(
        'svg',
        {
          viewBox: '${def.viewBox}',
          width: props.size,
          height: props.size,
          'aria-hidden': 'true',
          style: { color: props.color },
          ...attrs,
        },
        [
${inner},
        ],
      );
  },
});
`;
}

const icons = scanIcons();

rmSync(srcDir, { recursive: true, force: true });
mkdirSync(iconsDir, { recursive: true });

const exports: string[] = [];
for (const def of icons) {
  writeFileSync(join(iconsDir, `${def.pascalName}.ts`), iconComponent(def));
  exports.push(
    `export { ${def.pascalName}, type ${def.pascalName}Props } from './icons/${def.pascalName}.js';`,
    `export { ${def.pascalName} as ${def.pascalName}Icon } from './icons/${def.pascalName}.js';`,
  );
}
writeFileSync(join(srcDir, 'index.ts'), `${exports.join('\n')}\n`);

await $`bun x tsup`.cwd(pkgDir).quiet();
console.log(`vue: ${icons.length} icon components built`);
