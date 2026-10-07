// @vitest-environment node
//
// These pin engine behavior that this package's own HTML surface depends on,
// so an engine bump that changes it fails here rather than in a consumer's
// page. Each case names the carve-js issue that decided it.
import { describe, expect, it } from "vitest";
import {
  CARVE_ENGINE_VERSION,
  CARVE_SPEC_VERSION,
  renderCarveHtml,
  renderCarveHtmlWithReport,
} from "../src/core/index.js";

describe("engine behavior reaching the rendered HTML", () => {
  it("a flush-left line below an over-indented block in a list item leaves the item (carve#2542)", () => {
    for (const block of ["# Deep", "| a | b |", "---"]) {
      const html = renderCarveHtml(`- item\n\n      ${block}\nflush`);
      expect(html).toContain("<p>flush</p>");
      expect(html.indexOf("</ul>")).toBeLessThan(html.indexOf("<p>flush</p>"));
    }
  });

  it("a repeated heading takes a deduplicated id (carve#2511)", () => {
    const html = renderCarveHtml("# Dup\n\n# Dup");
    expect(html).toContain('id="Dup"');
    expect(html).toContain('id="Dup-2"');
  });

  it("a name lookup compares case exactly (carve#2520)", () => {
    const def = "\n\n[Label]: https://example.com";
    expect(renderCarveHtml("[a][Label]" + def)).toContain(
      '<a href="https://example.com">a</a>',
    );
    // A case-only mismatch stays literal text rather than resolving.
    expect(renderCarveHtml("[a][label]" + def)).not.toContain("<a ");
    expect(renderCarveHtml("![alt][label]" + def)).not.toContain("<img");
  });

  it("raw HTML is escaped under the library default and emitted when asked", () => {
    const src = "```=html\n<script>alert(1)</script>\n```";
    expect(renderCarveHtml(src)).toContain("&lt;script&gt;");
    expect(renderCarveHtml(src, { allowRawHtml: true })).toContain("<script>");
  });
});

describe("render-loss report (carve#2432)", () => {
  it("reports a blanked link destination with the normative message", () => {
    const report = renderCarveHtmlWithReport("[x](javascript:alert(1))");
    expect(report.value).toContain('href=""');
    expect(report.totalLosses).toBe(1);
    expect(report.losses[0].code).toBe("destination-denied");
    expect(report.losses[0].message).toBe("Blanked a denied destination scheme");
    expect(report.losses[0].target).toBe("html");
  });

  it("reports an autolink and an image under their own messages", () => {
    expect(
      renderCarveHtmlWithReport("<javascript:alert(1)>").losses[0]?.message,
    ).toBe("Blanked a denied destination scheme");
    expect(renderCarveHtmlWithReport("![a](vbscript:x)").losses[0]?.message).toBe(
      "Blanked a denied image source",
    );
  });

  it("counts one row per blanked destination", () => {
    const src = ["a", "b", "c"].map((n) => `[${n}](javascript:0)`).join("\n\n");
    const report = renderCarveHtmlWithReport(src);
    expect(report.totalLosses).toBe(3);
    expect(report.losses).toHaveLength(3);
  });

  it("reports nothing for a document that loses nothing", () => {
    const report = renderCarveHtmlWithReport("# ok\n\n[a](https://example.com)");
    expect(report.totalLosses).toBe(0);
    expect(report.losses).toEqual([]);
    expect(report.truncated).toBe(false);
  });

  it("renders the same HTML as renderCarveHtml, and honors the safe defaults", () => {
    const src = "# Hi\n\n`<b>x</b>`{=html}\n\n[x](javascript:1)";
    expect(renderCarveHtmlWithReport(src).value).toBe(renderCarveHtml(src));
    expect(renderCarveHtmlWithReport(src).value).toContain("&lt;b&gt;");
    expect(
      renderCarveHtmlWithReport(src, { allowRawHtml: true }).value,
    ).toContain("<b>x</b>");
  });

  it("returns an empty report for empty source", () => {
    expect(renderCarveHtmlWithReport("")).toEqual({
      value: "",
      losses: [],
      totalLosses: 0,
      truncated: false,
    });
  });

  it("passes the checked-render knobs through", () => {
    expect(() =>
      renderCarveHtmlWithReport("[x](javascript:1)", { strictLosses: true }),
    ).toThrow();
    const capped = renderCarveHtmlWithReport("[x](javascript:1)", {
      maxRenderLosses: 0,
    });
    expect(capped.truncated).toBe(true);
    expect(capped.totalLosses).toBe(1);
    expect(capped.losses).toHaveLength(0);
  });
});

describe("the bundled engine is identifiable", () => {
  it("reports the version the lockfile pins", async () => {
    const lock = (await import("../package-lock.json", {
      with: { type: "json" },
    })) as unknown as {
      default: { packages: Record<string, { version?: string }> };
    };
    const locked = lock.default.packages["node_modules/@markup-carve/carve"]
      ?.version;
    expect(locked).toMatch(/^\d+\.\d+\.\d+/);
    expect(CARVE_ENGINE_VERSION).toBe(locked);
  });

  it("reports the spec version it implements", () => {
    expect(CARVE_SPEC_VERSION).toMatch(/^\d+\.\d+/);
  });
});
