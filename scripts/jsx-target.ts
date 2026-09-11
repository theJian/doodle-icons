import type { CustomPlugin, XastElement } from 'svgo';

export type JsxTarget = 'react-dom' | 'react-native-svg';

const REACT_NATIVE_TAGS: Record<string, string> = {
  svg: 'Svg',
  path: 'Path',
  g: 'G',
  defs: 'Defs',
  clipPath: 'ClipPath',
  rect: 'Rect',
};

function jsxAttributeName(name: string): string {
  if (name === 'class') return 'className';
  if (name.startsWith('aria-') || name.startsWith('data-')) return name;
  // JSX camel-cases SVG and namespaced attributes, except aria-* and data-*.
  return name.replaceAll(/[-:]([a-z])/g, (_match, letter: string) => letter.toUpperCase());
}

function renameAttributes(node: XastElement): void {
  node.attributes = Object.fromEntries(
    Object.entries(node.attributes).map(([name, value]) => [jsxAttributeName(name), value]),
  );
}

export function jsxTargetPlugin(target: JsxTarget, sourceFile: string): CustomPlugin {
  return {
    name: `doodle-icons-${target}`,
    fn: () => ({
      element: {
        enter(node) {
          if (target === 'react-native-svg') {
            const component = REACT_NATIVE_TAGS[node.name];
            if (component === undefined) {
              throw new Error(`Unsupported React Native SVG element <${node.name}> in ${sourceFile}`);
            }
            node.name = component;
          }
          renameAttributes(node);
        },
      },
    }),
  };
}
