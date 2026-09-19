import type { CustomPlugin, XastElement } from 'svgo';
import jsxAttributeMappings from './jsx-attribute-mappings.ts';
import reactNativeSvgElementMappings from './react-native-svg-element-mappings.ts';

export type JsxTarget = 'react-dom' | 'react-native-svg' | 'solid';

function jsxAttributeName(name: string): string {
  return (jsxAttributeMappings as Record<string, string>)[name.toLowerCase()] ?? name;
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
            const component = (reactNativeSvgElementMappings as Record<string, string>)[node.name];
            if (component === undefined) {
              throw new Error(`Unsupported React Native SVG element <${node.name}> in ${sourceFile}`);
            }
            node.name = component;
          }
          if (target !== 'solid') renameAttributes(node);
        },
      },
    }),
  };
}
