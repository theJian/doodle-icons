import { optimize, type Config, type CustomPlugin } from 'svgo';
import type { JsxTarget } from './jsx-target.ts';
import type { IconDef } from './lib.ts';

export type SvgTarget = JsxTarget | 'vue';

function optimizationPlugins(
  componentName: string,
  target: SvgTarget,
): NonNullable<Config['plugins']> {
  return [
    {
      name: 'preset-default',
      params: {
        overrides: {
          cleanupIds: false,
          convertColors: { currentColor: 'black' },
          ...(target === 'react-native-svg'
            ? { inlineStyles: { onlyMatchedOnce: false } }
            : {}),
        },
      },
    },
    { name: 'removeXMLNS' },
    {
      name: 'prefixIds',
      params: {
        prefix: componentName,
        delim: '-',
        prefixClassNames: false,
      },
    },
  ];
}

/** Run the shared icon optimization pipeline, followed by target-specific plugins. */
export function optimizeSvg(
  def: IconDef,
  target: SvgTarget,
  plugins: CustomPlugin[] = [],
) {
  return optimize(def.rawSvg, {
    path: `${def.category}/${def.kebabName}.svg`,
    plugins: [...optimizationPlugins(def.pascalName, target), ...plugins],
  });
}
