import {
  computed,
  defineComponent,
  h,
  type ComputedRef,
  type MaybeRefOrGetter,
  type PropType,
} from "vue";
import { toValue } from "vue";
import { renderCarveHtml, type CarveOptions } from "../core/index.js";

export type { CarveOptions };
export { renderCarveHtml };

/**
 * Vue composable: reactive Carve -> HTML rendering.
 *
 * Accepts plain values, refs, or getters for both `source` and `options`
 * (via `toValue`), returning a `ComputedRef<string>` of the sanitized HTML.
 * Isomorphic - runs in Node (SSR) and the browser.
 */
export function useCarveHtml(
  source: MaybeRefOrGetter<string>,
  options?: MaybeRefOrGetter<CarveOptions | undefined>,
): ComputedRef<string> {
  return computed(() => renderCarveHtml(toValue(source), toValue(options)));
}

/**
 * `<Carve :source="..." :options="..." :as="..." />` - renders Carve markup as
 * sanitized HTML inside a wrapper element (default `<div>`) via `v-html`. The
 * HTML comes from carve-js (URL sanitization on, raw HTML escaped by default),
 * so it is safe to inject. Extra attributes fall through to the wrapper.
 */
export const Carve = defineComponent({
  name: "Carve",
  props: {
    source: {
      type: String,
      required: true,
    },
    options: {
      type: Object as PropType<CarveOptions>,
      default: undefined,
    },
    as: {
      type: String,
      default: "div",
    },
  },
  setup(props) {
    const html = computed(() => renderCarveHtml(props.source, props.options));
    return () => h(props.as, { innerHTML: html.value });
  },
});
