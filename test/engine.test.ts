// @vitest-environment node
import { describe, expect, it } from "vitest";
import { render, renderWithDiagnostics } from "@markup-carve/carve";
import {
  CARVE_ENGINE_VERSION,
  CARVE_SPEC_VERSION,
  renderCarveHtml,
  renderCarveHtmlWithReport,
  SAFE_DEFAULTS,
} from "../src/core/index.js";

describe("Carve 0.2 engine integration", () => {
  it("keeps a flush-left paragraph outside a nested list block", () => {
    for (const block of ["= Deep", "| a | b |", "***"]) {
      const html = renderCarveHtml(`- item\n\n      ${block}\nflush`);
      expect(html).toContain("<p>flush</p>");
      expect(html.indexOf("</ul>")).toBeLessThan(html.indexOf("<p>flush</p>"));
    }
  });

  it("deduplicates heading ids", () => {
    const html = renderCarveHtml("= Dup\n\n= Dup");
    expect(html).toContain('id="Dup"');
    expect(html).toContain('id="Dup-2"');
  });

  it("keeps exact-case reference lookup", () => {
    const def = "\n\n[Label]: https://example.com";
    expect(renderCarveHtml("[a][Label]" + def)).toContain(
      '<a href="https://example.com">a</a>',
    );
    expect(renderCarveHtml("[a][label]" + def)).not.toContain("<a ");
  });

  it("renders task states", () => {
    const html = renderCarveHtml("- [/] doing\n- [!] stuck\n- [x] done");
    expect(html).toContain('data-task-state="/"');
    expect(html).toContain('data-task-state="!"');
    expect(html).toContain('data-task-state="x"');
  });

  it("renders native table cell alignment", () => {
    const html = renderCarveHtml("|={>} a |={<} b |\n|{>} 1 | 2 |");
    expect(html).toContain('<th scope="col" style="text-align: right;">a</th>');
    expect(html).toContain('<th scope="col" style="text-align: left;">b</th>');
    expect(html).toContain('<td style="text-align: right;">1</td>');
  });

  it("escapes raw HTML by default and passes through only when enabled", () => {
    const src = "```=html\n<script>alert(1)</script>\n```";
    expect(renderCarveHtml(src)).toContain("&lt;script&gt;");
    expect(renderCarveHtml(src, { rawHtml: true })).toContain("<script>");
    expect(SAFE_DEFAULTS.rawHtml).toBe(false);
  });

  it("forwards render options to the 0.2 renderer", () => {
    const source = "= Heading";
    expect(renderCarveHtml(source, { headingIds: "lower" })).toBe(
      render(source, { ...SAFE_DEFAULTS, headingIds: "lower" }),
    );
    expect(renderCarveHtml(source, { headingIds: "lower" })).toContain('id="heading"');
  });

  it("exposes the engine's diagnostic result without changing its fields", () => {
    const source = "[x](javascript:alert(1))";
    const result = renderCarveHtmlWithReport(source);
    expect(result).toEqual(renderWithDiagnostics(source, SAFE_DEFAULTS));
    expect(result.html).toContain('href=""');
    expect(result.diagnostics[0]).toMatchObject({
      channel: "render-loss",
      code: "destination-denied",
      message: "Blanked a denied destination scheme",
    });
    expect(result.suppressedDiagnostics).toBe(0);
  });

  it("counts one diagnostic for each denied destination", () => {
    const source = ["a", "b", "c"].map((n) => `[${n}](javascript:0)`).join("\n\n");
    const result = renderCarveHtmlWithReport(source);
    expect(result.diagnostics.filter((d) => d.channel === "render-loss")).toHaveLength(3);
  });

  it("returns the engine result for empty input", () => {
    expect(renderCarveHtmlWithReport("")).toEqual({
      html: "",
      diagnostics: [],
      suppressedDiagnostics: 0,
    });
    expect(renderCarveHtmlWithReport("   \n\t\n")).toEqual(
      renderWithDiagnostics("   \n\t\n", SAFE_DEFAULTS),
    );
  });

  it("keeps HTML consistent between the two wrapper calls", () => {
    const source = "= Hi\n\n`<b>x</b>`{=html}\n\n[x](javascript:1)";
    expect(renderCarveHtmlWithReport(source).html).toBe(renderCarveHtml(source));
    expect(renderCarveHtmlWithReport(source).html).toContain("&lt;b&gt;");
    expect(renderCarveHtmlWithReport(source, { rawHtml: true }).html).toContain("<b>x</b>");
  });

  it("passes strict loss handling through both calls", () => {
    const source = "[x](javascript:1)";
    expect(() => renderCarveHtml(source, { strictLosses: true })).toThrow();
    const result = renderCarveHtmlWithReport(source, { strictLosses: true });
    expect(result.html).toBe("");
    expect(result.diagnostics[0]?.severity).toBe("error");
  });

  it("identifies the pinned engine and 0.2 contract", async () => {
    const lock = (await import("../package-lock.json", { with: { type: "json" } })) as unknown as {
      default: { packages: Record<string, { version?: string; resolved?: string }> };
    };
    const pinned = lock.default.packages["node_modules/@markup-carve/carve"];
    expect(pinned?.resolved).toContain("358613b49e0a1116362bf695dc417417adcfb4a6");
    expect(CARVE_ENGINE_VERSION).toBe(pinned?.version);
    expect(CARVE_SPEC_VERSION).toBe("0.2");
  });
});
