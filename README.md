# doodle-icons

> 451 hand-drawn doodle icons across 15 categories. Free (CC0) and open source — components for React, React Native, Vue and Flutter, plus a searchable docs site.

> **Icons designed by [Khushmeen Sidhu](https://khushmeen.com/icons.html)** — [Doodle Icons](https://khushmeen.com/icons.html).
> This repository repackages his icon set as components for React, React Native, Vue and Flutter.

**Browse all icons:** the site deploys to GitHub Pages (`Settings → Pages → Source: GitHub Actions` on your repo) and is searchable, filterable by category, and gives copy-paste snippets for every framework.

## Packages

| Package | Description |
| --- | --- |
| [`@doodle-icons/react`](packages/react) | React components (`forwardRef`, `DoodleIconProvider` for default size/color) |
| [`@doodle-icons/react-native`](packages/react-native) | React Native components built on `react-native-svg` |
| [`@doodle-icons/vue`](packages/vue) | Vue 3 render-function components |
| [`doodle_icons`](packages/flutter) | Flutter widgets built on `flutter_svg` |
| [`@doodle-icons/metadata`](packages/metadata) | JSON metadata (names, categories, viewBoxes) for every icon |
| [`apps/site`](apps/site) | Astro docs site with fuzzy search (deployed to GitHub Pages) |

## Usage

### React

```bash
bun add @doodle-icons/react
```

```tsx
import { Rocket, DoodleIconProvider } from '@doodle-icons/react';

<Rocket size={64} color="hotpink" />;

// set defaults for everything underneath
<DoodleIconProvider size={24}>
  <Rocket />
</DoodleIconProvider>;
```

Every icon also has a `...Icon` alias (`RocketIcon`), accepts all `SVGProps`, and is tree-shakable.

### React Native

```bash
bun add @doodle-icons/react-native react-native-svg
```

```tsx
import { Rocket } from '@doodle-icons/react-native';

<Rocket size={64} color="hotpink" />;
```

### Vue 3

```bash
bun add @doodle-icons/vue
```

```vue
<script setup>
import { Rocket } from '@doodle-icons/vue';
</script>

<template>
  <Rocket :size="64" color="hotpink" />
</template>
```

### Flutter

```yaml
dependencies:
  doodle_icons:
    git:
      url: https://github.com/jian/doodle-icons
      path: packages/flutter
```

```dart
import 'package:doodle_icons/doodle_icons.dart';

const Rocket(width: 64, height: 64);
const Rocket(color: Colors.pink, width: 48, height: 48);
```

### SVG / metadata

Raw SVGs live in [`icons/`](icons) (CC0, public domain). JSON metadata — names, categories, viewBoxes — for tooling:

```ts
import icons from '@doodle-icons/metadata/icons.json';
```

## Repository layout

```
icons/                  ← source of truth: 451 SVGs in 15 category folders (CC0)
scripts/                ← codegen: scans icons/ and generates every package
packages/
  react/                ← @doodle-icons/react        (generated src/ → tsup → dist)
  react-native/         ← @doodle-icons/react-native (generated src/ → tsup → dist)
  vue/                  ← @doodle-icons/vue          (generated src/ → tsup → dist)
  flutter/              ← doodle_icons               (generated lib/, flutter_svg widgets)
  metadata/             ← @doodle-icons/metadata     (generated icons.json)
apps/site/              ← Astro site (GitHub Pages)
.github/workflows/      ← CI (build + flutter analyze) & Pages deployment
```

The monorepo follows the same approach as [iconoir](https://github.com/iconoir-icons/iconoir): SVGs are the single source of truth, and per-framework packages are fully generated from them. The icon artwork itself is © [Khushmeen Sidhu](https://khushmeen.com/icons.html), dedicated to the public domain.

## Development

Requires [bun](https://bun.sh).

```bash
bun install

bun run build              # generate + compile all packages
bun run build:react        # individual targets: react | react-native | vue | flutter | metadata
bun scripts/smoke-test.tsx # SSR smoke test for react + vue packages
bun run dev:site           # docs site with hot reload
bun run build:site         # production site build → apps/site/dist
```

Notes:
- Generated directories (`packages/*/src`, `packages/flutter/lib`, `packages/metadata/icons.json`) are **gitignored** — run `bun run build` after cloning.
- Icon names must be unique across the set; collisions across categories get a category prefix (e.g. `currency/dollar` → `CurrencyDollar`, `finance/dollar` → `FinanceDollar`).
- The site is built with a `/doodle-icons/` base path for GitHub project pages. Override with `SITE_BASE=/ bun run build:site` for custom domains.

## Deploying the site to GitHub Pages

1. Push to GitHub (update the URLs in `package.json` files / README to your username).
2. Repo `Settings → Pages → Build and deployment → Source: **GitHub Actions**`.
3. `deploy-site.yml` builds and publishes on every push to `main`.

## Releasing (optional)

- npm packages: `bun publish` from each `packages/*` directory after `bun run build`.
- Flutter: `cd packages/flutter && flutter pub publish` (run `bun run build:flutter` first — `lib/` is generated).

## License

- Icons (`icons/`): designed by **[Khushmeen Sidhu](https://khushmeen.com/icons.html)** ([Doodle Icons](https://khushmeen.com/icons.html)), released under [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) — public domain, no attribution required. Credit is given here anyway because it's the right thing to do.
- All package code: [MIT](LICENSE).
