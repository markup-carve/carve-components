import { describe, expect, it } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { createElement } from "react";
import { Carve, useCarveHtml, renderCarveHtml } from "../src/react/index.js";
import { afterEach } from "vitest";

afterEach(cleanup);

describe("React <Carve>", () => {
  it("renders a heading and inline emphasis/strong", () => {
    const { container } = render(
      createElement(Carve, { source: "# Hi\n\n*bold* and /italic/" }),
    );
    const h1 = container.querySelector("h1");
    expect(h1).not.toBeNull();
    expect(h1?.textContent).toBe("Hi");
    expect(container.querySelector("strong")?.textContent).toBe("bold");
    expect(container.querySelector("em")?.textContent).toBe("italic");
  });

  it("renders a list", () => {
    const { container } = render(
      createElement(Carve, { source: "- one\n- two\n- three" }),
    );
    const items = container.querySelectorAll("ul > li");
    expect(items.length).toBe(3);
    expect(items[0].textContent).toBe("one");
  });

  it("renders a link with the correct href", () => {
    const { container } = render(
      createElement(Carve, { source: "[Carve](https://example.com)" }),
    );
    const a = container.querySelector("a");
    expect(a?.getAttribute("href")).toBe("https://example.com");
    expect(a?.textContent).toBe("Carve");
  });

  it("renders inline code", () => {
    const { container } = render(
      createElement(Carve, { source: "use `npm ci` here" }),
    );
    const code = container.querySelector("code");
    expect(code?.textContent).toBe("npm ci");
  });

  it("does not throw on empty or whitespace source", () => {
    expect(() =>
      render(createElement(Carve, { source: "" })),
    ).not.toThrow();
    cleanup();
    const { container } = render(createElement(Carve, { source: "   " }));
    // Wrapper exists but has no rendered Carve content.
    expect(container.querySelector("div")).not.toBeNull();
    expect(container.querySelector("h1")).toBeNull();
  });

  it("renders into a custom wrapper element via `as` and forwards className", () => {
    const { container } = render(
      createElement(Carve, {
        source: "*x*",
        as: "section",
        className: "prose",
      }),
    );
    const section = container.querySelector("section.prose");
    expect(section).not.toBeNull();
    expect(section?.querySelector("strong")?.textContent).toBe("x");
  });

  it("useCarveHtml returns the same HTML string as renderCarveHtml", () => {
    function Probe() {
      const html = useCarveHtml("# Title");
      return createElement("output", { "data-html": html });
    }
    const { container } = render(createElement(Probe));
    const out = container.querySelector("output");
    expect(out?.getAttribute("data-html")).toBe(renderCarveHtml("# Title"));
    expect(out?.getAttribute("data-html")).toContain("<h1>Title</h1>");
  });

  it("escapes a hostile raw-HTML/script input by default (no live script)", () => {
    const hostile =
      "`<img src=x onerror=alert(1)>`{=html}\n\n```=html\n<script>alert(2)</script>\n```";
    const { container } = render(createElement(Carve, { source: hostile }));
    // Safe-by-default: raw HTML is escaped to text, so no real elements appear.
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
    // The escaped text is present, proving carve-js neutralized it.
    expect(container.innerHTML).toContain("&lt;script&gt;");
  });

  it("blanks a javascript: URL scheme (carve-js URL sanitization passthrough)", () => {
    const { container } = render(
      createElement(Carve, { source: "[x](javascript:alert(1))" }),
    );
    const a = container.querySelector("a");
    expect(a).not.toBeNull();
    // carve-js blanks dangerous schemes -> href="" (link inert, text kept).
    expect(a?.getAttribute("href")).toBe("");
  });
});
