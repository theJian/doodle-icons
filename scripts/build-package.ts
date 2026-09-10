import { rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { $ } from 'bun';
import { fileURLToPath } from 'node:url';

/** Preserve module boundaries so sideEffects:false can discard unused icons. */
export async function buildPackage(pkgDir: string): Promise<void> {
  const distDir = join(pkgDir, 'dist');
  rmSync(distDir, { recursive: true, force: true });
  const compiler = fileURLToPath(import.meta.resolve('typescript/bin/tsc'));
  for (const format of ['esm', 'cjs'] as const) {
    const outDir = format === 'esm' ? distDir : join(distDir, 'cjs');
    const module = format === 'esm' ? 'ESNext' : 'CommonJS';
    const resolution = format === 'esm' ? 'bundler' : 'node';
    await $`bun ${compiler} --project ${join(pkgDir, 'tsconfig.json')} --noEmit false --noEmitOnError --rootDir ${join(pkgDir, 'src')} --outDir ${outDir} --module ${module} --moduleResolution ${resolution} --declaration --sourceMap`;
  }
  // Both .js runtime files and .d.ts declarations in this directory are CommonJS.
  writeFileSync(join(distDir, 'cjs', 'package.json'), '{"type":"commonjs"}\n');
}
