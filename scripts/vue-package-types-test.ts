import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { $ } from 'bun';

const fixtureDir = mkdtempSync(join(tmpdir(), 'doodle-icons-vue-types-'));
const packageDir = join(import.meta.dir, '..', 'packages', 'vue');
const packageLink = join(fixtureDir, 'node_modules', '@doodle-icons', 'vue');
const consumer = `
import { Search, type SearchProps } from '@doodle-icons/vue';

const props: SearchProps = { size: 24, color: 'rebeccapurple' };
void Search;
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
  await $`bun ${compiler} --noEmit --strict --skipLibCheck false --target ES2022 --module ESNext --moduleResolution bundler ${esmConsumer}`;
  await $`bun ${compiler} --noEmit --strict --skipLibCheck false --target ES2022 --module NodeNext --moduleResolution NodeNext ${cjsConsumer}`;
} finally {
  rmSync(fixtureDir, { recursive: true, force: true });
}

console.log('vue package types passed: bundler ESM + NodeNext CommonJS');
