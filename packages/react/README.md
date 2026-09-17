# Doodle Icons for React

[![npm version](https://img.shields.io/npm/v/@doodle-icons/react)](https://www.npmjs.com/package/@doodle-icons/react)

400+ handcrafted doodle icons designed by [Khushmeen Sidhu](https://khushmeen.com/icons.html).

[Browse all icons →](https://thejian.github.io/doodle-icons/)

## Installation

```bash
npm install @doodle-icons/react
```

## Usage

```tsx
import { Rocket } from '@doodle-icons/react';

<Rocket size={64} color="hotpink" />;
```

Use `DoodleIconProvider` to set defaults for a group of icons:

```tsx
import { DoodleIconProvider, Rocket } from '@doodle-icons/react';

<DoodleIconProvider size={24} color="hotpink">
  <Rocket />
</DoodleIconProvider>;
```

## License

Icons: [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) (public domain). Package code: [MIT](https://github.com/theJian/doodle-icons/blob/main/LICENSE).
