# Contributing

## Repository layout

```
icons/                  ← source of truth: 400+ handcrafted SVGs in 15 category folders (CC0)
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

1. Push to GitHub.
2. Repo `Settings → Pages → Build and deployment → Source: **GitHub Actions**`.
3. `deploy-site.yml` builds and publishes on every push to `main`.

## Releasing

- npm packages: `bun publish` from each `packages/*` directory after `bun run build`.
- Flutter: `cd packages/flutter && flutter pub publish` (run `bun run build:flutter` first — `lib/` is generated).
