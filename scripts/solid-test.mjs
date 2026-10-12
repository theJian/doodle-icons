import { createRequire } from 'node:module';
const resolvePackage = createRequire(
  new URL('../packages/solid/package.json', import.meta.url),
).resolve;
import assert from 'node:assert/strict';
import { createComponent } from 'solid-js';
import { renderToString } from 'solid-js/web';
const icons = await import(resolvePackage('@doodle-icons/solid'));
import { readFileSync } from 'node:fs';

const metadata = JSON.parse(
  readFileSync(new URL('../packages/metadata/icons.json', import.meta.url)),
);
for (const icon of metadata.icons) {
  assert.equal(typeof icons[icon.pascal], 'function', icon.pascal);
  const html = renderToString(() => createComponent(icons[icon.pascal], {}));
  assert.ok(html.includes(`viewBox="${icon.viewBox}"`), icon.pascal);
  assert.ok(html.includes('width="24"'), icon.pascal);
}
const html = renderToString(() =>
  createComponent(icons.DoodleIconProvider, {
    size: 48,
    color: 'tomato',
    get children() {
      return createComponent(icons.Search, {
        color: 'purple',
        width: 60,
        class: 'search',
        'aria-hidden': false,
        'aria-label': 'Search',
      });
    },
  }),
);
for (const value of [
  'height="48"',
  'width="60"',
  'color="purple"',
  'aria-hidden="false"',
  'aria-label="Search"',
  'clip-path="url(#Search-clip0)"',
  'fill="currentColor"',
]) {
  assert.ok(html.includes(value), value);
}
assert.match(html, /class="search\s*"/);
assert.ok(!html.includes('size='));
console.log(
  'solid: all icons render on the server; provider, overrides, attributes, and SVG references pass',
);
