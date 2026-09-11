import type { IconDef } from './lib.ts';
import { optimizeSvg } from './svg.ts';

/** Optimize an icon and add the bindings consumed by the generated Vue SFC. */
export function convertIconToVueSvg(def: IconDef): string {
  const svg = optimizeSvg(def, 'vue').data;
  return svg.replace(/^<svg\b([^>]*)>/, (_tag, attributes: string) => {
    const staticAttributes = attributes.replace(
      /\s(?:width|height)="[^"]*"/g,
      '',
    );
    return `<svg${staticAttributes} :width="size" :height="size" aria-hidden="true" :style="{ color }" v-bind="$attrs">`;
  });
}
