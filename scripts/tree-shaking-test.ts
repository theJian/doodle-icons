import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
for (const framework of ['react', 'vue', 'react-native', 'solid']) {
  const result = await build({
    stdin: {
      contents: `export { Rocket } from '@doodle-icons/${framework}';`,
      resolveDir: `${root}/packages/${framework}`,
      sourcefile: 'consumer.ts',
    },
    bundle: true,
    format: 'esm',
    minify: true,
    write: false,
    metafile: true,
    external: ['react', 'vue', 'react-native-svg', 'solid-js', 'solid-js/*'],
  });
  const output = Object.values(result.metafile!.outputs)[0];
  const includedIcons = Object.entries(output.inputs)
    .filter(([path, info]) => path.includes('/dist/icons/') && info.bytesInOutput > 0)
    .map(([path]) => path.split('/').pop());
  const expectedIcon = framework === 'vue' ? 'Rocket.vue.js' : 'Rocket.js';
  assert.deepEqual(includedIcons, [expectedIcon], `${framework}: Rocket must include only Rocket`);
  assert.ok(output.bytes > 0);
  console.log(`${framework}: Rocket retains only Rocket (${output.bytes} bytes, frameworks excluded)`);
}
