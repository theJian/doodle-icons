import assert from 'node:assert/strict';
import { convertIconToFlutterSvg, convertIconToJsx, convertIconToVueSvg } from './codegen.ts';
import { scanIcons } from './lib.ts';
import { renderTemplate, renderVueTemplate } from './template.ts';

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

const solid = convertIconToJsx(search, 'solid', { width: '{local.size}', '{...props}': null });
assert.match(solid.jsx, /clip-path="url\(#Search-clip0\)"/);
assert.match(solid.jsx, /fill="currentColor"/);
assert.doesNotMatch(solid.jsx, /clipPath=/);

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

const flutterSvg = convertIconToFlutterSvg(search);
assert.ok(flutterSvg.length < search.rawSvg.length, 'SVGO should reduce the Flutter SVG size');
assert.match(flutterSvg, /clip-path="url\(#Search-clip0\)"/);
assert.match(flutterSvg, /id="Search-clip0"/);

for (const icon of scanIcons()) {
  const svg = convertIconToFlutterSvg(icon);
  const root = svg.slice(0, svg.indexOf('>') + 1);
  assert.match(root, /xmlns="http:\/\/www.w3.org\/2000\/svg"/);
  assert.ok(root.includes(`viewBox="${icon.viewBox}"`), `${icon.pascalName}: preserve viewBox`);
  assert.doesNotMatch(root, /\s(?:width|height)=/);
  assert.doesNotMatch(svg, /currentColor/);
}

const flutter = renderTemplate('flutter-icon.dart.template', {
  componentName: search.pascalName,
  svg: flutterSvg,
});
assert.match(flutter, /class Search extends widgets.StatelessWidget/);
assert.ok(flutter.includes(`r'''\n${flutterSvg}'''`));
assert.match(flutter, /widgets.ColorFilter.mode\(color!, widgets.BlendMode.srcIn\)/);
assert.match(flutter, /width: width/);
assert.match(flutter, /height: height/);
assert.equal(
  renderTemplate('flutter-icon-exports.dart.template', {
    snakeName: search.snakeName,
  }),
  "export 'src/search.dart';\n",
);

console.log('generation tests passed: optimized React, React Native, Vue, and Flutter sources');
