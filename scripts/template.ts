import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { format } from 'prettier';

const templatesDir = join(import.meta.dir, 'templates');
const templates = new Map<string, string>();
const renderers = new Map<string, (...values: string[]) => string>();

function loadTemplate(name: string): string {
  const cached = templates.get(name);
  if (cached !== undefined) return cached;

  const template = readFileSync(join(templatesDir, name), 'utf8');
  templates.set(name, template);
  return template;
}

function compileTemplate(template: string, keys: string[]): (...values: string[]) => string {
  // Templates are trusted build inputs; replacement values stay function arguments.
  const escaped = template.replaceAll('\\', '\\\\').replaceAll('`', '\\`');
  return new Function(...keys, `return \`${escaped}\`;`) as (...values: string[]) => string;
}

export function renderTemplate(name: string, data: Record<string, string> = {}): string {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const cacheKey = `${name}:${keys.join(',')}`;
  let render = renderers.get(cacheKey);
  if (render === undefined) {
    render = compileTemplate(loadTemplate(name), keys);
    renderers.set(cacheKey, render);
  }
  return render(...values);
}

export async function renderTypeScriptTemplate(
  name: string,
  values: Record<string, string> = {},
): Promise<string> {
  return format(renderTemplate(name, values), { parser: 'typescript', singleQuote: true });
}
