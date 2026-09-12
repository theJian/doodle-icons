import assert from 'node:assert/strict';
import { convertIconToJsx, convertIconToVueSvg } from './codegen.ts';
import { scanIcons } from './lib.ts';
import { renderVueTemplate } from './template.ts';

const search = scanIcons().find(({ pascalName }) => pascalName === 'Search');
assert.ok(search, 'Search icon fixture must exist');

const react = convertIconToJsx(search, 'react-dom', {
  width: '{size}',
  height: '{size}',
  '{...props}': null,
});
assert.match(react.jsx, /fill="currentColor"/);
assert.match(react.jsx, /clipPath="url\(#Search-clip0\)"/);
assert.match(react.jsx, /width=\{size\}/);
assert.ok(react.jsx.length < search.rawSvg.length, 'SVGO should reduce the source SVG size');

const reactNative = convertIconToJsx(search, 'react-native-svg', {
  width: '{size}',
  height: '{size}',
  color: '{color}',
  '{...props}': null,
});
assert.deepEqual(reactNative.components.sort(), ['ClipPath', 'Defs', 'G', 'Path', 'Svg']);
assert.match(reactNative.jsx, /<Svg[^>]* color=\{color\}/);
assert.match(reactNative.jsx, /\{\.\.\.props\}/);
assert.match(reactNative.jsx, /<Path fill="currentColor"/);

const vueSvg = convertIconToVueSvg(search);
const vue = await renderVueTemplate('vue-icon.vue.template', {
  componentName: search.pascalName,
  svg: vueSvg,
});
assert.match(vue, /<script lang="ts">/);
assert.match(vue, /<template>/);
assert.match(vue, /fill="currentColor"/);
assert.match(vue, /clip-path="url\(#Search-clip0\)"/);
assert.match(vue, /:width="size"/);
assert.match(vue, /v-bind="\$attrs"/);
assert.ok(vueSvg.length < search.rawSvg.length, 'SVGO should reduce the Vue SVG size');

console.log('generation tests passed: optimized React, React Native, and Vue sources');
