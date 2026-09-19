import { createRequire } from 'node:module';
const resolvePackage = createRequire(
  new URL('../packages/solid/package.json', import.meta.url),
).resolve;
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';

const window = new Window();
for (const key of [
  'window',
  'document',
  'Node',
  'Element',
  'HTMLElement',
  'SVGElement',
])
  globalThis[key] = key === 'window' ? window : window[key];
const { createComponent, createSignal } = await import('solid-js');
const { render } = await import('solid-js/web');
const { Rocket, Search, DoodleIconProvider } = await import(
  resolvePackage('@doodle-icons/solid')
);
const [size, setSize] = createSignal(32);
const [color, setColor] = createSignal('tomato');
const [localSize, setLocalSize] = createSignal(undefined);
const [label, setLabel] = createSignal('Launch');
let ref;
let clicks = 0;
const host = document.createElement('div');
const dispose = render(
  () =>
    createComponent(DoodleIconProvider, {
      get size() {
        return size();
      },
      get color() {
        return color();
      },
      get children() {
        return [
          createComponent(Rocket, {
            get size() {
              return localSize();
            },
            get 'aria-label'() {
              return label();
            },
            'aria-hidden': false,
            ref: (node) => {
              ref = node;
            },
            onClick: () => {
              clicks++;
            },
          }),
          createComponent(Search, { size: 20, color: 'blue' }),
        ];
      },
    }),
  host,
);
document.body.append(host);
const [rocket, search] = host.querySelectorAll('svg');
assert.equal(ref, rocket);
assert.equal(rocket.namespaceURI, 'http://www.w3.org/2000/svg');
assert.equal(rocket.getAttribute('width'), '32');
setSize(48);
setColor('purple');
setLabel('Go');
assert.equal(rocket.getAttribute('width'), '48');
assert.equal(rocket.getAttribute('color'), 'purple');
assert.equal(rocket.getAttribute('aria-label'), 'Go');
assert.equal(search.getAttribute('width'), '20');
assert.equal(search.getAttribute('color'), 'blue');
setLocalSize(64);
assert.equal(rocket.getAttribute('width'), '64');
setLocalSize(undefined);
assert.equal(rocket.getAttribute('width'), '48');
rocket.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
assert.equal(clicks, 1);
assert.equal(rocket.hasAttribute('size'), false);
assert.equal(
  search.querySelector('g').getAttribute('clip-path'),
  'url(#Search-clip0)',
);
dispose();
assert.equal(host.childNodes.length, 0);
console.log(
  'solid: browser props and provider stay reactive; refs, events, SVG attributes, and cleanup pass',
);
