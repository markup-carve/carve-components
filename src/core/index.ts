import {
  carveToHtml,
  carveToHtmlWithReport,
  LIB_VERSION,
  SPEC_VERSION,
} from "@markup-carve/carve";

/**
 * Version of the carve-js engine compiled into this package's `dist/`, and the
 * Carve spec version it implements.
 *
 * The engine is bundled, so a consumer cannot read it from their own
 * dependency tree, and rendered output follows it. Without these a bug report
 * has no way to say which engine answered.
 */
export const CARVE_ENGINE_VERSION: string = LIB_VERSION;
export const CARVE_SPEC_VERSION: string = SPEC_VERSION;

/**
 * Options forwarded to carve-js when rendering Carve source to HTML.
 *
 * This is the option bag accepted by carve-js's `carveToHtml` (parse +
 * resolve + render options merged). We re-export the inferred type so
 * component consumers get the exact, version-matched surface without us
 * hand-maintaining a copy. The two security-relevant knobs are called out
 * here for visibility:
 *
 * - `sanitizeUrls` (carve-js default `true`): blanks dangerous URL schemes
 *   (`javascript:`, `vbscript:`, `data:`, `file:`) on link href / image src.
 *   Leave it on for untrusted input.
 * - `allowRawHtml` (carve-js default `true`): when `true`, the explicit
 *   raw-HTML author forms (`` `…`{=html} `` inline and ` ```=html ` block)
 *   emit verbatim, which CAN inject a live `<script>`. This library defaults
 *   it to `false` (see `renderCarveHtml`) so the components are safe by
 *   default for untrusted input. Pass `allowRawHtml: true` explicitly only
 *   for fully trusted content.
 */
export type CarveOptions = NonNullable<Parameters<typeof carveToHtml>[1]>;

/**
 * Default options applied by `renderCarveHtml` (and therefore by both the
 * React and Vue components / hooks) unless the caller overrides them.
 *
 * We deliberately diverge from carve-js's corpus-matching defaults to be
 * safe-by-default for untrusted input: raw HTML is escaped to text rather
 * than emitted live. URL sanitization is already on by default in carve-js
 * but we pin it here so it cannot be silently lost.
 */
export const SAFE_DEFAULTS: CarveOptions = {
  allowRawHtml: false,
  sanitizeUrls: true,
};

/**
 * Render Carve source to a (carve-js-sanitized) HTML string.
 *
 * Pure and isomorphic: no DOM or `window` access, so it runs identically in
 * Node (SSR) and the browser. The output is the trusted, sanitized HTML that
 * the framework components inject via `dangerouslySetInnerHTML` / `v-html`.
 *
 * An empty or whitespace-only `source` yields an empty string (carve-js
 * behavior) rather than throwing.
 */
export function renderCarveHtml(source: string, options?: CarveOptions): string {
  if (source == null || source === "") {
    return "";
  }
  return carveToHtml(source, { ...SAFE_DEFAULTS, ...options });
}

/**
 * Options accepted by `renderCarveHtmlWithReport`: the render options above
 * plus carve-js's checked-render knobs (`strictLosses`, `maxRenderLosses`).
 */
export type CarveReportOptions = NonNullable<
  Parameters<typeof carveToHtmlWithReport>[1]
>;

/**
 * The report carve-js returns alongside the HTML: the rendered string in
 * `value`, plus a row per structural loss the render incurred.
 */
export type CarveRenderResult = ReturnType<typeof carveToHtmlWithReport>;

/**
 * Render Carve source to HTML and keep carve-js's render-loss report.
 *
 * Same HTML as `renderCarveHtml` for the same input and options, so this is a
 * drop-in when a caller needs to know what the render dropped rather than only
 * what it produced. The row that matters most here is `destination-denied`:
 * URL sanitization blanks a dangerous scheme silently in the HTML (the link
 * stays, its href is `""`), and this is the only way to see it happened.
 */
export function renderCarveHtmlWithReport(
  source: string,
  options?: CarveReportOptions,
): CarveRenderResult {
  if (source == null || source === "") {
    return { value: "", losses: [], totalLosses: 0, truncated: false };
  }
  return carveToHtmlWithReport(source, { ...SAFE_DEFAULTS, ...options });
}

export { carveToHtml, carveToHtmlWithReport };
