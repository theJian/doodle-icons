# Contributing

## Repository layout

```
icons/                  ← source SVGs organized by category
scripts/                ← generators that build the packages from icons/
  templates/            ← source templates for generated framework components
packages/
  react/                ← @doodle-icons/react
  react-native/         ← @doodle-icons/react-native
  solid/                ← @doodle-icons/solid
  vue/                  ← @doodle-icons/vue
  flutter/              ← doodle_icons
  metadata/             ← @doodle-icons/metadata
apps/site/              ← Astro documentation site
.github/workflows/      ← CI workflows
```

The SVGs in `icons/` are the source files. The framework packages, Flutter widgets, and metadata are generated from them.

## Development

Requires [Bun](https://bun.sh) and Node.js 20.19+ (Node.js 24 is used in CI).

```bash
bun install

bun run build              # generate and compile all packages
bun run build:react        # individual targets: react | react-native | vue | solid | flutter | metadata
bun run test               # generation, rendering, and tree-shaking checks
bun run dev:site           # run the documentation site with hot reload
bun run build:site         # build the production site
```

Icon names must be unique across the set. When names collide across categories, the generated name gets a category prefix (for example, `currency/dollar` becomes `CurrencyDollar` and `finance/dollar` becomes `FinanceDollar`).

## Releasing

- npm packages: run `bun publish` from each `packages/*` directory after `bun run build`.
- Flutter: run `bun run build:flutter`, then run `flutter pub publish` from `packages/flutter`.
