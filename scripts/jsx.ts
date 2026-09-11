import { optimize, type Config, type CustomPlugin, type XastNode, type XastRoot } from 'svgo';
import { jsxTargetPlugin, type JsxTarget } from './jsx-target.ts';
import type { IconDef } from './lib.ts';

type SvgProps = Record<string, string | null>;
type Components = Set<string>;

function optimizationPlugins(componentName: string, target: JsxTarget): NonNullable<Config['plugins']> {
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

function serializeAttributes(attributes: Record<string, string>, svgProps?: SvgProps): string {
  const props = new Map<string, string | null>(Object.entries(attributes));
  for (const [name, value] of Object.entries(svgProps ?? {})) {
    props.delete(name);
    props.set(name, value);
  }

  return [...props]
    .map(([name, value]) => {
      if (value === null) return ` ${name}`;
      if (value.startsWith('{')) return ` ${name}=${value}`;
      return ` ${name}=${JSON.stringify(value)}`;
    })
    .join('');
}

function unexpectedNode(node: never): never {
  const type = String((node as { type?: unknown }).type);
  throw new Error(`Unexpected XAST node type "${type}"`);
}

function serializeNode(
  node: XastNode,
  components: Components,
  svgProps?: SvgProps,
  isRootElement = false,
): string {
  switch (node.type) {
    case 'root': {
      const children = node.children
        .map((child) => serializeNode(child, components, svgProps, true))
        .filter(Boolean);
      return children.length === 1 ? children[0]! : `<>${children.join('')}</>`;
    }
    case 'element': {
      if (/^[A-Z]/.test(node.name)) components.add(node.name);
      const attributes = serializeAttributes(node.attributes, isRootElement ? svgProps : undefined);
      if (node.children.length === 0) return `<${node.name}${attributes} />`;
      const children = node.children.map((child) => serializeNode(child, components)).join('');
      return `<${node.name}${attributes}>${children}</${node.name}>`;
    }
    case 'text':
    case 'cdata':
      return `{${JSON.stringify(node.value)}}`;
    case 'comment':
      return `{/* ${node.value} */}`;
    case 'doctype':
    case 'instruction':
      return '';
    default:
      return unexpectedNode(node);
  }
}

function optimizeIcon(def: IconDef, target: JsxTarget): XastRoot {
  const sourceFile = `${def.category}/${def.kebabName}.svg`;
  let optimized: XastRoot | undefined;
  const extractPlugin: CustomPlugin = {
    name: 'doodle-icons-extract-xast',
    fn(root) {
      optimized = root;
    },
  };

  optimize(def.rawSvg, {
    path: sourceFile,
    plugins: [
      ...optimizationPlugins(def.pascalName, target),
      jsxTargetPlugin(target, sourceFile),
      extractPlugin,
    ],
  });
  if (optimized === undefined) throw new Error(`SVGO did not produce an AST for ${sourceFile}`);
  return optimized;
}

/** Optimize an icon with SVGO, then serialize its XAST as framework-specific JSX. */
export function convertIconToJsx(def: IconDef, target: JsxTarget, svgProps: SvgProps) {
  const components: Components = new Set();
  const jsx = serializeNode(optimizeIcon(def, target), components, svgProps);
  return { jsx, components: [...components] };
}
