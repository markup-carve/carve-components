import enginePackage from "@markup-carve/carve/package.json" with { type: "json" };
import {
  DEFAULT_DENIED_SCHEMES,
  render,
  renderWithDiagnostics,
  type RenderOptions,
  type RenderOutput,
} from "@markup-carve/carve/v2";

/** Version of the engine bundled into the built components. */
export const CARVE_ENGINE_VERSION: string = enginePackage.version;
export const CARVE_SPEC_VERSION = "0.2";

/** The Carve 0.2 HTML render options accepted by both framework components. */
export type CarveOptions = RenderOptions;
export type CarveReportOptions = RenderOptions;
export type CarveRenderResult = RenderOutput;

/** Explicit secure defaults for HTML injected by the React and Vue components. */
export const SAFE_DEFAULTS: CarveOptions = {
  rawHtml: false,
  urlPolicy: { deny: DEFAULT_DENIED_SCHEMES },
};

/** Render a Carve 0.2 source string to HTML for either framework. */
export function renderCarveHtml(source: string, options?: CarveOptions): string {
  return render(source, { ...SAFE_DEFAULTS, ...options });
}

/** Render HTML with the Carve 0.2 parse and render-loss diagnostics. */
export function renderCarveHtmlWithReport(
  source: string,
  options?: CarveReportOptions,
): CarveRenderResult {
  return renderWithDiagnostics(source, { ...SAFE_DEFAULTS, ...options });
}

export { render, renderWithDiagnostics };
