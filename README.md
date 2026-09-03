# doodle-icons

400+ handcrafted doodle icons across 15 categories. Free (CC0) and open source — components for React, React Native, Vue and Flutter.

**[Browse all icons →](https://thejian.github.io/doodle-icons/)**

> Icons designed by **[Khushmeen Sidhu](https://khushmeen.com/icons.html)** — this repository repackages his [Doodle Icons](https://khushmeen.com/icons.html) set as framework components.

## Packages

| Package | Description |
| --- | --- |
| [`@doodle-icons/react`](packages/react) | React components |
| [`@doodle-icons/react-native`](packages/react-native) | React Native components (`react-native-svg`) |
| [`@doodle-icons/vue`](packages/vue) | Vue 3 components |
| [`doodle_icons`](packages/flutter) | Flutter widgets (`flutter_svg`) |
| [`@doodle-icons/metadata`](packages/metadata) | JSON metadata (names, categories, viewBoxes) |

## Usage

### React

```bash
bun add @doodle-icons/react
```

```tsx
import { Rocket } from '@doodle-icons/react';

<Rocket size={64} color="hotpink" />;
```

Set default size/color for everything underneath with `DoodleIconProvider`:

```tsx
import { DoodleIconProvider, Rocket } from '@doodle-icons/react';

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
      url: https://github.com/theJian/doodle-icons
      path: packages/flutter
```

```dart
import 'package:doodle_icons/doodle_icons.dart';

const Rocket(width: 64, height: 64, color: Colors.pink);
```

### Raw SVG / metadata

Raw SVGs live in [`icons/`](icons) (CC0, public domain). Names, categories and viewBoxes as JSON for tooling:

```ts
import icons from '@doodle-icons/metadata/icons.json';
```

## License

- Icons (`icons/`): designed by **[Khushmeen Sidhu](https://khushmeen.com/icons.html)**, released under [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) — public domain, no attribution required.
- Package code: [MIT](LICENSE).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and repository architecture.
