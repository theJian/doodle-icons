import assert from 'node:assert/strict';
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { $ } from 'bun';

const packageDir = join(import.meta.dir, '..', 'packages', 'vue');
for (const iconsDir of [
  join(packageDir, 'dist', 'icons'),
  join(packageDir, 'dist', 'cjs', 'icons'),
]) {
  const files = readdirSync(iconsDir);
  assert.ok(files.includes('Copy.js'));
  assert.ok(files.includes('Copy.d.ts'));
  assert.ok(files.every((file) => !file.includes('.vue')));
}

const fixtureDir = mkdtempSync(join(tmpdir(), 'doodle-icons-vue-types-'));
const packageLink = join(fixtureDir, 'node_modules', '@doodle-icons', 'vue');
const consumer = `
import { Copy, type CopyProps } from '@doodle-icons/vue';

const props: CopyProps = { size: 24, color: 'rebeccapurple' };
void Copy;
void props;
`;

try {
  mkdirSync(dirname(packageLink), { recursive: true });
  symlinkSync(packageDir, packageLink, 'dir');

  const esmConsumer = join(fixtureDir, 'consumer.mts');
  const cjsConsumer = join(fixtureDir, 'consumer.cts');
  writeFileSync(esmConsumer, consumer);
  writeFileSync(cjsConsumer, consumer);

  const compiler = fileURLToPath(import.meta.resolve('typescript/bin/tsc'));
  await $`bun ${compiler} --noEmit --strict --skipLibCheck false --target ES2022 --module NodeNext --moduleResolution NodeNext ${esmConsumer} ${cjsConsumer}`;
} finally {
  rmSync(fixtureDir, { recursive: true, force: true });
}

console.log('vue package types passed: ESM + CommonJS consumers');
