import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { format } from 'prettier';

const templatesDir = join(import.meta.dir, 'templates');
type Renderer = { keys: string[]; render: (...values: string[]) => string };
const renderers = new Map<string, Renderer>();

function compileTemplate(template: string, keys: string[]): (...values: string[]) => string {
  // Templates are trusted build inputs; replacement values stay function arguments.
  const escaped = template.replaceAll('\\', '\\\\').replaceAll('`', '\\`');
  return new Function(...keys, `return \`${escaped}\`;`) as (...values: string[]) => string;
}

export function renderTemplate(name: string, data: Record<string, string> = {}): string {
  const keys = Object.keys(data);
  const values = Object.values(data);
  let renderer = renderers.get(name);
  if (renderer === undefined) {
    const template = readFileSync(join(templatesDir, name), 'utf8');
    renderer = { keys, render: compileTemplate(template, keys) };
    renderers.set(name, renderer);
  } else if (
    renderer.keys.length !== keys.length ||
    renderer.keys.some((key, index) => key !== keys[index])
  ) {
    throw new Error(
      `Template ${name} must always be rendered with the same data keys`,
    );
  }
  return renderer.render(...values);
}

export async function renderTypeScriptTemplate(
  name: string,
  values: Record<string, string> = {},
): Promise<string> {
  return format(renderTemplate(name, values), { parser: 'typescript', singleQuote: true });
}

export async function renderVueTemplate(
  name: string,
  values: Record<string, string> = {},
): Promise<string> {
  return format(renderTemplate(name, values), { parser: 'vue', singleQuote: true });
}
