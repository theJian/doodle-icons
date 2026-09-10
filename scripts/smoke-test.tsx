import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderToString } from 'react-dom/server';
import { Search, DoodleIconProvider, Rocket } from '../packages/react/dist/index.js';
import { Search as VueSearch } from '../packages/vue/dist/index.js';
import { renderToString as vueRenderToString } from '@vue/server-renderer';
import { h } from 'vue';
import metadata from '../packages/metadata/icons.json';

function ok(condition: unknown, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`);
}
function equal(actual: unknown, expected: unknown, message: string): void {
  if (actual !== expected) throw new Error(`FAIL: ${message} (got ${actual}, expected ${expected})`);
}

equal(metadata.total, 451, 'metadata icon count');
equal(metadata.categories.length, 15, 'metadata category count');

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
ok(reactHtml.includes('#SearchClip0'), 'react: uniquified clip ids');
ok(!reactHtml.includes('fill="black"'), 'react: no raw black fills');

const vueHtml = await vueRenderToString(h(VueSearch, { size: 32, color: 'rebeccapurple' }));
ok(vueHtml.includes('currentColor'), 'vue: recolorable fills');
ok(vueHtml.includes('width="32"'), 'vue: size prop');
ok(vueHtml.toLowerCase().includes('rebeccapurple'), 'vue: color prop');
ok(vueHtml.includes('viewBox="0 0 160 154"'), 'vue: viewBox preserved');

console.log('smoke tests passed: metadata + react + vue');
