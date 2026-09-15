import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** Default icons directory, resolved relative to this file (Bun-only path).
 * Astro bundles this module into its SSR entry where `import.meta.dir` does
 * not exist, so callers there must pass an explicit directory to scanIcons. */
function defaultIconsDir(): string {
  return join(import.meta.dir, '..', 'icons');
}

export interface IconNode {
  tag: string;
  attrs: Record<string, string>;
  children: IconNode[];
}

export interface IconDef {
  /** kebab-case name, e.g. "coffee-cup-1" */
  kebabName: string;
  /** PascalCase name, e.g. "CoffeeCup1" */
  pascalName: string;
  /** snake_case name, e.g. "coffee_cup_1" */
  snakeName: string;
  /** kebab-case category, e.g. "e-commerce" */
  category: string;
  viewBox: string;
  width: number;
  height: number;
  /** Parsed children of the root <svg> element */
  nodes: IconNode[];
  /** Raw SVG file content */
  rawSvg: string;
}

export function toPascal(kebab: string): string {
  return kebab
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

export function toSnake(kebab: string): string {
  return kebab.replaceAll('-', '_');
}

function parseAttrs(tagContent: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const attrRe = /([a-zA-Z_][\w:.-]*)\s*=\s*"([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = attrRe.exec(tagContent))) {
    attrs[m[1]!] = m[2]!;
  }
  return attrs;
}

/** Minimal XML parser, sufficient for the constrained doodle SVG surface
 * (only path, g, defs, clipPath, rect elements with quoted attributes). */
export function parseSvgChildren(svg: string): IconNode[] {
  const inner = svg.slice(svg.indexOf('>') + 1, svg.lastIndexOf('</svg>'));
  const root: IconNode = { tag: 'svg', attrs: {}, children: [] };
  const stack: IconNode[] = [root];
  const tagRe = /<(\/?)([a-zA-Z][\w-]*)((?:\s+[\w:.-]+\s*=\s*"[^"]*")*)\s*(\/?)>/g;
  let cursor = 0;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(inner))) {
    const [full, closing, tag, attrsStr, selfClosing] = m;
    if (cursor < m.index && inner.slice(cursor, m.index).trim()) {
      throw new Error(`Unexpected text node in SVG: ${JSON.stringify(inner.slice(cursor, m.index))}`);
    }
    cursor = m.index + full.length;
    if (closing) {
      const top = stack.pop();
      if (!top || top.tag !== tag) throw new Error(`Mismatched closing tag </${tag}>`);
      continue;
    }
    const node: IconNode = { tag, attrs: parseAttrs(attrsStr ?? ''), children: [] };
    stack[stack.length - 1]!.children.push(node);
    if (!selfClosing) stack.push(node);
  }
  if (stack.length !== 1) throw new Error('Unclosed tags in SVG');
  return root.children;
}

/** Uniquify clipPath ids per icon so multiple icons can coexist on a page,
 * and normalize fills: "black" -> "currentColor" so icons are recolorable.
 * The raw SVG (used by the Flutter target) is left untouched. */
export function uniquifyIds(nodes: IconNode[], pascalName: string): void {
  const walk = (node: IconNode) => {
    for (const [key, value] of Object.entries(node.attrs)) {
      if (key === 'fill' && value === 'black') {
        node.attrs[key] = 'currentColor';
      } else if (key === 'id' && value.startsWith('clip')) {
        node.attrs[key] = `${pascalName}${value.charAt(0).toUpperCase()}${value.slice(1)}`;
      } else if (key === 'clip-path') {
        node.attrs[key] = value.replace(/url\(#clip(\d+)\)/, (_s, n: string) => `url(#${pascalName}Clip${n})`);
      }
    }
    node.children.forEach(walk);
  };
  nodes.forEach(walk);
}

/** Normalize an icon filename to kebab-case: lowercase, spaces/underscores to dashes.
 * A leading digit (e.g. "2-double-tap") is rotated to a suffix ("double-tap-2")
 * so the PascalCase name is a valid identifier. */
function sanitizeKebab(name: string): string {
  const kebab = name
    .trim()
    .toLowerCase()
    .replaceAll(/[\s_]+/g, '-')
    .replaceAll(/-+/g, '-')
    .replaceAll(/^-|-$/g, '');
  return kebab.replace(/^(\d+)-(.+)$/, '$2-$1');
}

export function scanIcons(dir: string = defaultIconsDir()): IconDef[] {
  const categories = readdirSync(dir).filter((f) => statSync(join(dir, f)).isDirectory());
  const icons: IconDef[] = [];
  for (const category of categories.sort()) {
    for (const file of readdirSync(join(dir, category)).sort()) {
      if (!file.endsWith('.svg')) continue;
      const kebabName = sanitizeKebab(file.replace(/\.svg$/, ''));
      const rawSvg = readFileSync(join(dir, category, file), 'utf8');
      const svgTag = rawSvg.slice(0, rawSvg.indexOf('>') + 1);
      const viewBox = svgTag.match(/viewBox="([^"]*)"/)?.[1] ?? '';
      const [, w, h] = viewBox.split(/\s+/);
      if (!viewBox || !w || !h) throw new Error(`Missing viewBox in ${category}/${file}`);
      icons.push({
        kebabName,
        pascalName: '',
        snakeName: '',
        category,
        viewBox,
        width: Number(w),
        height: Number(h),
        nodes: parseSvgChildren(rawSvg),
        rawSvg,
      });
    }
  }

  // Icon names must be unique across the whole set: when the same kebab name
  // appears in multiple categories, disambiguate exports with a category
  // prefix (e.g. currency/dollar -> CurrencyDollar, finance/dollar -> FinanceDollar).
  const occurrences = new Map<string, number>();
  for (const icon of icons) {
    occurrences.set(icon.kebabName, (occurrences.get(icon.kebabName) ?? 0) + 1);
  }
  for (const icon of icons) {
    const uniqueKebab =
      (occurrences.get(icon.kebabName) ?? 0) > 1 ? `${icon.category}-${icon.kebabName}` : icon.kebabName;
    icon.pascalName = toPascal(uniqueKebab);
    icon.snakeName = toSnake(uniqueKebab);
  }

  const names = new Set<string>();
  for (const icon of icons) {
    if (names.has(icon.pascalName)) throw new Error(`Duplicate icon name: ${icon.pascalName}`);
    names.add(icon.pascalName);
  }
  return icons;
}

/** Full inline <svg> string (currentColor fills, uniquified clip ids) for
 * server-rendered usage such as the docs site. */
export function inlineSvg(def: IconDef, extraAttrs: Record<string, string> = {}): string {
  uniquifyIds(def.nodes, def.pascalName);
  const toHtml = (node: IconNode, indent: string): string => {
    const attrs = Object.entries(node.attrs)
      .map(([k, v]) => `${k}="${v}"`)
      .join(' ');
    if (node.children.length === 0) {
      return `${indent}<${node.tag}${attrs ? ` ${attrs}` : ''}/>`;
    }
    const children = node.children.map((c) => toHtml(c, `${indent}  `)).join('\n');
    return `${indent}<${node.tag}${attrs ? ` ${attrs}` : ''}>\n${children}\n${indent}</${node.tag}>`;
  };
  const attrStr = Object.entries({ ...extraAttrs })
    .map(([k, v]) => `${k}="${v}"`)
    .join(' ');
  return `<svg viewBox="${def.viewBox}" ${attrStr}>${def.nodes.map((n) => toHtml(n, '')).join('')}</svg>`;
}
