![Doodle Icons — 400+ handcrafted icons](.github/assets/hero.png)

Doodle icons for React, React Native, Vue and Flutter.

Based on [Doodle Icons](https://khushmeen.com/icons.html) by Khushmeen Sidhu.

**[Browse all icons →](https://thejian.github.io/doodle-icons/)**

## Packages

See each package’s README for installation and usage.

| Framework | Package |
| --- | --- |
| React | [@doodle-icons/react](packages/react/README.md) |
| React Native | [@doodle-icons/react-native](packages/react-native/README.md) |
| Vue 3 | [@doodle-icons/vue](packages/vue/README.md) |
| Flutter | [doodle_icons](packages/flutter/README.md) |

## License

Icons: [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) (public domain). Package code: [MIT](LICENSE).

## Publishing

The `Publish packages` workflow publishes the npm packages and Flutter's
`doodle_icons` package when a stable GitHub release is published. Package versions
must match the release tag (`v<version>`). Already published versions are skipped.

For Flutter, enable [automated publishing on pub.dev](https://dart.dev/tools/pub/automated-publishing)
for `doodle_icons`, using repository `theJian/doodle-icons` and tag pattern
`v{{version}}`. A new package must be published manually once before this can be configured.
To retry manually, dispatch the workflow **from the release tag** and supply the
same tag as the `tag` input; checking out a tag from a branch run does not change
the GitHub OIDC identity required by pub.dev.
