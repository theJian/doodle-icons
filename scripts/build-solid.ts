import {
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { $ } from 'bun';
import { transformAsync } from '@babel/core';
import { convertIconToJsx } from './codegen.ts';
import { scanIcons } from './lib.ts';
import { renderTypeScriptTemplate } from './template.ts';

const pkgDir = join(import.meta.dir, '..', 'packages', 'solid');
const srcDir = join(pkgDir, 'src');
const distDir = join(pkgDir, 'dist');
const icons = scanIcons();
rmSync(srcDir, { recursive: true, force: true });
rmSync(distDir, { recursive: true, force: true });
mkdirSync(join(srcDir, 'icons'), { recursive: true });
writeFileSync(
  join(srcDir, 'context.tsx'),
  await renderTypeScriptTemplate('solid-context.tsx.template'),
);
for (const def of icons) {
  const { jsx } = convertIconToJsx(def, 'solid', {
    width: '{local.size}',
    height: '{local.size}',
    color: '{local.color}',
    'aria-hidden': 'true',
    '{...props}': null,
  });
  writeFileSync(
    join(srcDir, 'icons', `${def.pascalName}.tsx`),
    await renderTypeScriptTemplate('solid-icon.tsx.template', {
      componentName: def.pascalName,
      jsx,
    }),
  );
}
writeFileSync(
  join(srcDir, 'index.ts'),
  "export * from './context.js';\n" +
    icons
      .map(
        ({ pascalName }) =>
          `export { ${pascalName} } from './icons/${pascalName}.js';`,
      )
      .join('\n') +
    '\n',
);

// Preserve each icon module so consumers can discard unused icons.
for (const file of readdirSync(srcDir, { recursive: true }).filter((file) =>
  /\.tsx?$/.test(file),
)) {
  for (const generate of ['dom', 'ssr'] as const) {
    const output = join(
      distDir,
      generate === 'ssr' ? 'server' : '',
      file.replace(/\.tsx?$/, '.js'),
    );
    const result = await transformAsync(
      readFileSync(join(srcDir, file), 'utf8'),
      {
        filename: join(srcDir, file),
        babelrc: false,
        configFile: false,
        presets: [
          ['babel-preset-solid', { generate, hydratable: true }],
          '@babel/preset-typescript',
        ],
      },
    );
    if (!result?.code) throw new Error(`Failed to compile ${file}`);
    mkdirSync(dirname(output), { recursive: true });
    writeFileSync(output, result.code + '\n');
  }
}
const compiler = fileURLToPath(import.meta.resolve('typescript/bin/tsc'));
await $`bun ${compiler} --project ${join(pkgDir, 'tsconfig.json')} --noEmit false --noEmitOnError --emitDeclarationOnly --outDir ${distDir}`;
console.log(`solid: ${icons.length} icon components built (browser + server)`);
