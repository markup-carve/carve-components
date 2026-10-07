import {
  computed,
  defineComponent,
  h,
  useAttrs,
  type ComputedRef,
  type MaybeRefOrGetter,
  type PropType,
} from "vue";
import { toValue } from "vue";
import {
  renderCarveHtml,
  renderCarveHtmlWithReport,
  type CarveOptions,
  type CarveReportOptions,
  type CarveRenderResult,
  CARVE_ENGINE_VERSION,
  CARVE_SPEC_VERSION,
} from "../core/index.js";

export type { CarveOptions, CarveReportOptions, CarveRenderResult };
export {
  renderCarveHtml,
  renderCarveHtmlWithReport,
  CARVE_ENGINE_VERSION,
  CARVE_SPEC_VERSION,
};

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
  // Attributes are applied by hand, after the rendered HTML, so a fallthrough
  // `innerHTML` cannot replace it. Under the default fallthrough an attribute
  // bag spread onto the component (`v-bind="attrs"`) won that collision and
  // put unsanitized markup in the wrapper, which the React side never allowed.
  inheritAttrs: false,
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
    const attrs = useAttrs();
    const html = computed(() => renderCarveHtml(props.source, props.options));
    return () => h(props.as, { ...attrs, innerHTML: html.value });
  },
});
