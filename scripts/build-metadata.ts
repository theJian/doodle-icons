import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { scanIcons } from './lib.ts';

const outDir = join(import.meta.dir, '..', 'packages', 'metadata');
const icons = scanIcons();

const categories = [...new Set(icons.map((i) => i.category))].map((name) => ({
  name,
  count: icons.filter((i) => i.category === name).length,
}));

const data = {
  name: 'doodle-icons',
  total: icons.length,
  categories,
  icons: icons.map((i) => ({
    name: i.kebabName,
    pascal: i.pascalName,
    category: i.category,
    viewBox: i.viewBox,
    width: i.width,
    height: i.height,
  })),
};

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'icons.json'), `${JSON.stringify(data, null, 2)}\n`);

console.log(`metadata: ${icons.length} icons across ${categories.length} categories`);
