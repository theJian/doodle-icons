import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { renderToString } from 'react-dom/server';
import { Search, DoodleIconProvider, Rocket } from '../packages/react/dist/index.js';
import {
  DoodleIconProvider as ReactNativeDoodleIconProvider,
  useIconProps as useReactNativeIconProps,
} from '../packages/react-native/dist/context.js';
import { Search as VueSearch } from '../packages/vue/dist/index.js';
import { renderToString as vueRenderToString } from '@vue/server-renderer';
import { h } from 'vue';
import metadata from '../packages/metadata/icons.json';

const require = createRequire(import.meta.url);

function ok(condition: unknown, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`);
}
function equal(actual: unknown, expected: unknown, message: string): void {
  if (actual !== expected) throw new Error(`FAIL: ${message} (got ${actual}, expected ${expected})`);
}

equal(metadata.total, 451, 'metadata icon count');
equal(metadata.categories.length, 15, 'metadata category count');

function ReactNativeContextProbe(passedProps: {
  size?: number | string;
  color?: string;
}) {
  const contextProps = useReactNativeIconProps();
  const props = { ...contextProps, ...passedProps };
  return <span data-size={props.size} data-color={props.color} />;
}

const reactDist = join(import.meta.dir, '..', 'packages', 'react', 'dist');
const clientDirective = /^['"]use client['"];?/;
ok(clientDirective.test(readFileSync(join(reactDist, 'context.js'), 'utf8')), 'react: context is a client module');
ok(
  clientDirective.test(readFileSync(join(reactDist, 'icons', 'Rocket.js'), 'utf8')),
  'react: icons are client modules',
);

const reactHtml = renderToString(
  <DoodleIconProvider size={48}>
    <Search data-testid="search" />
    <Rocket color="tomato" />
  </DoodleIconProvider>,
);
ok(reactHtml.includes('currentColor'), 'react: recolorable fills');
ok(reactHtml.includes('width="48"'), 'react: provider size');
ok(reactHtml.includes('data-testid="search"'), 'react: props passthrough');
ok(reactHtml.includes('style="color:tomato'), 'react: color prop');
ok(reactHtml.includes('#Search-clip0'), 'react: uniquified clip ids');
ok(!reactHtml.includes('fill="black"'), 'react: no raw black fills');

const reactNativeDist = join(import.meta.dir, '..', 'packages', 'react-native', 'dist');
const defaultReactNativeHtml = renderToString(<ReactNativeContextProbe />);
ok(defaultReactNativeHtml.includes('data-size="24"'), 'react-native: default size');
ok(defaultReactNativeHtml.includes('data-color="#000000"'), 'react-native: default color');
const reactNativeHtml = renderToString(
  <ReactNativeDoodleIconProvider size={48} color="tomato">
    <ReactNativeContextProbe color="rebeccapurple" />
  </ReactNativeDoodleIconProvider>,
);
ok(reactNativeHtml.includes('data-size="48"'), 'react-native: provider size');
ok(
  reactNativeHtml.includes('data-color="rebeccapurple"'),
  'react-native: icon props override provider values',
);
ok(
  readFileSync(join(reactNativeDist, 'index.d.ts'), 'utf8').includes("export * from './context.js'"),
  'react-native: context API is publicly exported',
);
ok(
  readFileSync(join(reactNativeDist, 'icons', 'Rocket.js'), 'utf8').includes('useIconProps'),
  'react-native: icons consume context defaults',
);

const vueHtml = await vueRenderToString(h(VueSearch, { size: 32, color: 'rebeccapurple' }));
ok(vueHtml.includes('currentColor'), 'vue: recolorable fills');
ok(vueHtml.includes('width="32"'), 'vue: size prop');
ok(vueHtml.toLowerCase().includes('rebeccapurple'), 'vue: color prop');
ok(vueHtml.includes('viewBox="0 0 160 154"'), 'vue: viewBox preserved');
const vueDist = join(import.meta.dir, '..', 'packages', 'vue', 'dist');
ok(
  readFileSync(join(vueDist, 'icons', 'Search.vue.js'), 'utf8').includes(
    'createElementBlock',
  ),
  'vue: SFC template compiled to optimized render helpers',
);
ok(
  readFileSync(join(vueDist, 'index.d.ts'), 'utf8').includes(
    "from './icons/Search.vue.js'",
  ),
  'vue: declaration barrel uses NodeNext-compatible runtime specifiers',
);
const { Search: CjsVueSearch } = require('../packages/vue/dist/cjs/index.js') as {
  Search: typeof VueSearch;
};
const cjsVueHtml = await vueRenderToString(h(CjsVueSearch, { size: 20 }));
ok(cjsVueHtml.includes('width="20"'), 'vue: CommonJS build renders');

console.log('smoke tests passed: metadata + react + react-native + vue');
