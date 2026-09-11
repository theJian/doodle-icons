import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { basename, join } from 'node:path';
import ts from 'typescript';
import {
  compileScript,
  compileTemplate,
  parse,
  type SFCDescriptor,
} from 'vue/compiler-sfc';

type ModuleFormat = 'esm' | 'cjs';
const diagnosticsHost: ts.FormatDiagnosticsHost = {
  getCanonicalFileName: (file) => file,
  getCurrentDirectory: ts.sys.getCurrentDirectory,
  getNewLine: () => ts.sys.newLine,
};

function fail(
  filename: string,
  stage: string,
  errors: readonly unknown[],
): never {
  const details = errors
    .map((error) => (error instanceof Error ? error.message : String(error)))
    .join('\n');
  throw new Error(`${filename}: ${stage} failed\n${details}`);
}

function readDescriptor(filename: string): SFCDescriptor {
  const source = readFileSync(filename, 'utf8');
  const result = parse(source, { filename });
  if (result.errors.length > 0) fail(filename, 'parse', result.errors);
  if (result.descriptor.script === null)
    throw new Error(`${filename}: missing <script> block`);
  if (result.descriptor.template === null)
    throw new Error(`${filename}: missing <template> block`);
  return result.descriptor;
}

function compileComponent(filename: string, descriptor: SFCDescriptor): string {
  const id = basename(filename, '.vue');
  const script = compileScript(descriptor, { id, genDefaultAs: '__sfc__' });
  const template = compileTemplate({
    id,
    filename,
    source: descriptor.template!.content,
    isProd: true,
    compilerOptions: { bindingMetadata: script.bindings },
  });
  if (template.errors.length > 0)
    fail(filename, 'template compilation', template.errors);

  const render = template.code.replace(
    'export function render',
    'function render',
  );
  return `${script.content}\n${render}\n__sfc__.render = render;\nexport default __sfc__;\n`;
}

function transpile(
  source: string,
  filename: string,
  format: ModuleFormat,
): string {
  const result = ts.transpileModule(source, {
    fileName: filename,
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: format === 'esm' ? ts.ModuleKind.ESNext : ts.ModuleKind.CommonJS,
      isolatedModules: true,
    },
  });
  const errors =
    result.diagnostics?.filter(
      ({ category }) => category === ts.DiagnosticCategory.Error,
    ) ?? [];
  if (errors.length > 0) {
    fail(filename, 'TypeScript transpilation', [
      ts.formatDiagnostics(errors, diagnosticsHost),
    ]);
  }
  return result.outputText;
}

function emitDeclarations(
  pkgDir: string,
  distDir: string,
  indexSource: string,
  components: Map<string, string>,
): void {
  const tempDir = mkdtempSync(join(pkgDir, '.vue-types-'));
  const tempIconsDir = join(tempDir, 'icons');
  mkdirSync(tempIconsDir, { recursive: true });

  try {
    const sources = [join(tempDir, 'index.ts')];
    writeFileSync(sources[0]!, indexSource);
    for (const [name, source] of components) {
      const filename = join(tempIconsDir, `${name}.ts`);
      writeFileSync(filename, source);
      sources.push(filename);
    }

    const config = ts.readConfigFile(
      join(pkgDir, 'tsconfig.json'),
      ts.sys.readFile,
    );
    if (config.error !== undefined)
      fail(pkgDir, 'tsconfig loading', [config.error]);
    const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, pkgDir);
    if (parsed.errors.length > 0)
      fail(pkgDir, 'tsconfig parsing', parsed.errors);
    const program = ts.createProgram(sources, {
      ...parsed.options,
      noEmit: false,
      emitDeclarationOnly: true,
      declaration: true,
      declarationMap: false,
      sourceMap: false,
      rootDir: tempDir,
      outDir: distDir,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
    });
    const diagnostics = ts.getPreEmitDiagnostics(program);
    if (diagnostics.length > 0) {
      fail(pkgDir, 'declaration type checking', [
        ts.formatDiagnosticsWithColorAndContext(diagnostics, diagnosticsHost),
      ]);
    }
    const emitted = program.emit();
    if (emitted.emitSkipped)
      fail(pkgDir, 'declaration emit', emitted.diagnostics);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

/** Compile generated Vue SFCs while preserving one runtime module per icon. */
export function buildVuePackage(pkgDir: string): void {
  const srcDir = join(pkgDir, 'src');
  const srcIconsDir = join(srcDir, 'icons');
  const distDir = join(pkgDir, 'dist');
  const componentSources = new Map<string, string>();
  const runtimeSources = new Map<string, string>();

  for (const file of readdirSync(srcIconsDir)
    .filter((file) => file.endsWith('.vue'))
    .sort()) {
    const name = basename(file, '.vue');
    const filename = join(srcIconsDir, file);
    const descriptor = readDescriptor(filename);
    componentSources.set(name, descriptor.script!.content);
    runtimeSources.set(name, compileComponent(filename, descriptor));
  }

  const indexSource = readFileSync(join(srcDir, 'index.ts'), 'utf8').replaceAll(
    ".vue'",
    ".js'",
  );
  rmSync(distDir, { recursive: true, force: true });

  for (const format of ['esm', 'cjs'] as const) {
    const outDir = format === 'esm' ? distDir : join(distDir, 'cjs');
    const outIconsDir = join(outDir, 'icons');
    mkdirSync(outIconsDir, { recursive: true });
    writeFileSync(
      join(outDir, 'index.js'),
      transpile(indexSource, join(srcDir, 'index.ts'), format),
    );
    for (const [name, source] of runtimeSources) {
      writeFileSync(
        join(outIconsDir, `${name}.js`),
        transpile(source, join(srcIconsDir, `${name}.ts`), format),
      );
    }
  }

  emitDeclarations(pkgDir, distDir, indexSource, componentSources);
  cpSync(join(distDir, 'index.d.ts'), join(distDir, 'cjs', 'index.d.ts'));
  cpSync(join(distDir, 'icons'), join(distDir, 'cjs', 'icons'), {
    recursive: true,
    filter: (source) => !source.endsWith('.js'),
  });
  writeFileSync(join(distDir, 'cjs', 'package.json'), '{"type":"commonjs"}\n');
}
