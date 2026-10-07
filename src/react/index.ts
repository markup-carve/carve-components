import {
  createElement,
  forwardRef,
  useMemo,
  type ComponentPropsWithoutRef,
  type ElementType,
  type ForwardedRef,
  type ReactElement,
} from "react";
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
 * React hook: memoized Carve -> HTML rendering.
 *
 * Recomputes only when `source` or the identity of `options` changes. For a
 * stable result across renders, pass a stable `options` object (e.g. module
 * constant or `useMemo`d). Runs in Node and the browser (no DOM access).
 */
export function useCarveHtml(source: string, options?: CarveOptions): string {
  return useMemo(() => renderCarveHtml(source, options), [source, options]);
}

type CarveOwnProps<E extends ElementType> = {
  /** Carve markup source to render. */
  source: string;
  /** Options forwarded to carve-js. Defaults are safe-by-default (no raw HTML). */
  options?: CarveOptions;
  /** Wrapper element type. Defaults to `div`. */
  as?: E;
};

export type CarveProps<E extends ElementType = "div"> = CarveOwnProps<E> &
  Omit<ComponentPropsWithoutRef<E>, keyof CarveOwnProps<E>>;

interface CarveInnerProps {
  source?: string;
  options?: CarveOptions;
  as?: ElementType;
  [key: string]: unknown;
}

function CarveInner(
  { source, options, as, ...rest }: CarveInnerProps,
  ref: ForwardedRef<Element>,
): ReactElement {
  const html = useCarveHtml(source ?? "", options);
  const Tag = (as ?? "div") as ElementType;
  return createElement(Tag, {
    ref,
    ...rest,
    dangerouslySetInnerHTML: { __html: html },
  });
}

/**
 * `<Carve source="# Hi" />` - renders Carve markup as sanitized HTML inside a
 * wrapper element (default `<div>`). The HTML comes from carve-js, which
 * sanitizes URLs and (with this library's safe defaults) escapes raw HTML, so
 * injecting it via `dangerouslySetInnerHTML` does not reintroduce an XSS
 * vector. Forwards a ref and arbitrary props (`className`, `id`, `style`, ...)
 * to the wrapper.
 */
export const Carve = forwardRef(CarveInner) as <E extends ElementType = "div">(
  props: CarveProps<E> & { ref?: ForwardedRef<Element> },
) => ReactElement;
