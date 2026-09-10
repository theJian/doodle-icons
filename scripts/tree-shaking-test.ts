import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
for (const framework of ['react', 'vue', 'react-native']) {
  for (const exported of ['Rocket', 'RocketIcon']) {
    const result = await build({
      stdin: {
        contents: `export { ${exported} } from '@doodle-icons/${framework}';`,
        resolveDir: `${root}/packages/${framework}`,
        sourcefile: 'consumer.ts',
      },
      bundle: true,
      format: 'esm',
      minify: true,
      write: false,
      metafile: true,
      external: ['react', 'vue', 'react-native-svg'],
    });
    const output = Object.values(result.metafile!.outputs)[0];
    const includedIcons = Object.entries(output.inputs)
      .filter(([path, info]) => path.includes('/dist/icons/') && info.bytesInOutput > 0)
      .map(([path]) => path.split('/').pop());
    assert.deepEqual(includedIcons, ['Rocket.js'], `${framework}: ${exported} must include only Rocket`);
    assert.ok(output.bytes > 0);
    console.log(`${framework}: ${exported} retains only Rocket (${output.bytes} bytes, frameworks excluded)`);
  }
}
