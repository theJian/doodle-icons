# @doodle-icons/solid

Hand-drawn SVG icon components for SolidJS 1.9+.

```sh
npm install @doodle-icons/solid solid-js
```

```tsx
import { createSignal } from 'solid-js';
import { Rocket, Search, DoodleIconProvider } from '@doodle-icons/solid';

export function Example() {
  const [size, setSize] = createSignal(24);
  return (
    <DoodleIconProvider size={32} color="tomato">
      <Search />
      <Rocket size={size()} class="icon" aria-hidden="false" aria-label="Launch" />
      <button onClick={() => setSize(48)}>Enlarge</button>
    </DoodleIconProvider>
  );
}
```

Icons default to `size={24}` and `color="currentColor"`. Provider defaults and individual props are reactive; individual props take precedence. Standard Solid SVG attributes, styles, event handlers, and refs pass through to the SVG. Explicit `width` and `height` override `size`. CSS color (including `style`) overrides the SVG color attribute.

Icons are decorative (`aria-hidden="true"`) by default. For meaningful icons, pass `aria-hidden="false"`, `role="img"`, and an `aria-label`.

Named imports are tree-shakeable. The ESM package includes compiled browser and server builds selected by the `browser` and `node` export conditions. Use a Solid-aware bundler (such as Vite with vite-plugin-solid) for applications; CommonJS is not provided.

Exports include all icon components, `DoodleIconProvider`, `useIconProps`, and the `DoodleIconProps` and `DoodleIconConfig` types.

Icons: CC0 1.0. Package code: MIT.
