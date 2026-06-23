// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { createSSRApp, h } from "vue";
import { renderToString as vueRenderToString } from "@vue/server-renderer";
import { Carve as ReactCarve } from "../src/react/index.js";
import { Carve as VueCarve } from "../src/vue/index.js";

describe("SSR (no DOM)", () => {
  it("confirms there is no document/window in this environment", () => {
    expect(typeof (globalThis as { document?: unknown }).document).toBe(
      "undefined",
    );
  });

  it("React renderToString produces the Carve HTML string", () => {
    const out = renderToString(
      createElement(ReactCarve, {
        source: "# Hi\n\n*bold*",
        as: "article",
      }),
    );
    expect(out).toContain("<article");
    expect(out).toContain("<h1>Hi</h1>");
    expect(out).toContain("<strong>bold</strong>");
  });

  it("Vue server-renderer produces the Carve HTML string", async () => {
    const app = createSSRApp({
      render: () =>
        h(VueCarve, { source: "# Hi\n\n*bold*", as: "article" }),
    });
    const out = await vueRenderToString(app);
    expect(out).toContain("<article");
    expect(out).toContain("<h1>Hi</h1>");
    expect(out).toContain("<strong>bold</strong>");
  });
});
