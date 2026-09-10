import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildPackage } from './build-package.ts';
import { scanIcons, uniquifyIds, type IconDef, type IconNode } from './lib.ts';

const pkgDir = join(import.meta.dir, '..', 'packages', 'react');
const srcDir = join(pkgDir, 'src');
const iconsDir = join(srcDir, 'icons');

/** React DOM wants camelCase SVG attributes (it maps them back to the real
 * attribute names at render time, and warns on kebab-case). */
const REACT_ATTRS: Record<string, string> = {
  'clip-path': 'clipPath',
  'clip-rule': 'clipRule',
  'fill-rule': 'fillRule',
  'fill-opacity': 'fillOpacity',
  'stroke-width': 'strokeWidth',
  'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin',
};

function toJsx(node: IconNode, indent: string): string {
  const attrs = Object.entries(node.attrs)
    .map(([k, v]) => `${REACT_ATTRS[k] ?? k}="${v}"`)
    .join(' ');
  if (node.children.length === 0) {
    return `${indent}<${node.tag}${attrs ? ` ${attrs}` : ''} />`;
  }
  const children = node.children.map((c) => toJsx(c, `${indent}  `)).join('\n');
  return `${indent}<${node.tag}${attrs ? ` ${attrs}` : ''}>\n${children}\n${indent}</${node.tag}>`;
}

function iconComponent(def: IconDef): string {
  uniquifyIds(def.nodes, def.pascalName);
  const inner = def.nodes.map((n) => toJsx(n, '        ')).join('\n');
  return `"use client";

import * as React from 'react';
import { useIconProps, type DoodleIconProps } from '../context.js';

export type ${def.pascalName}Props = DoodleIconProps;

export const ${def.pascalName} = React.forwardRef<SVGSVGElement, ${def.pascalName}Props>(
  function ${def.pascalName}(passedProps, forwardedRef) {
    const { size, color, ...props } = { ...useIconProps(), ...passedProps };
    return (
      <svg
        viewBox="${def.viewBox}"
        width={size}
        height={size}
        style={{ color, ...props.style }}
        aria-hidden="true"
        ref={forwardedRef}
        {...props}
      >
${inner}
      </svg>
    );
  },
);
`;
}

function contextFile(): string {
  return `"use client";

import * as React from 'react';

export type DoodleIconConfig = {
  size?: number | string;
  color?: string;
};

const DoodleIconContext = React.createContext<DoodleIconConfig>({});

export function DoodleIconProvider({
  children,
  ...config
}: DoodleIconConfig & { children?: React.ReactNode }) {
  return <DoodleIconContext.Provider value={config}>{children}</DoodleIconContext.Provider>;
}

export function useIconProps(): Required<DoodleIconConfig> {
  const config = React.useContext(DoodleIconContext);
  return { size: 24, color: 'currentColor', ...config };
}

export type DoodleIconProps = Omit<React.SVGProps<SVGSVGElement>, 'fill'> & {
  size?: number | string;
  color?: string;
};
`;
}

const icons = scanIcons();

rmSync(srcDir, { recursive: true, force: true });
mkdirSync(iconsDir, { recursive: true });
writeFileSync(join(srcDir, 'context.tsx'), contextFile());

const exports: string[] = ["export * from './context.js';"];
for (const def of icons) {
  writeFileSync(join(iconsDir, `${def.pascalName}.tsx`), iconComponent(def));
  exports.push(
    `export { ${def.pascalName}, type ${def.pascalName}Props } from './icons/${def.pascalName}.js';`,
    `export { ${def.pascalName} as ${def.pascalName}Icon } from './icons/${def.pascalName}.js';`,
  );
}
writeFileSync(join(srcDir, 'index.ts'), `${exports.join('\n')}\n`);

await buildPackage(pkgDir);
console.log(`react: ${icons.length} icon components built`);
