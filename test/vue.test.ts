import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { ref } from "vue";
import { Carve, useCarveHtml, renderCarveHtml } from "../src/vue/index.js";

describe("Vue <Carve>", () => {
  it("renders a heading and inline emphasis/strong", () => {
    const wrapper = mount(Carve, {
      props: { source: "# Hi\n\n*bold* and /italic/" },
    });
    expect(wrapper.find("h1").exists()).toBe(true);
    expect(wrapper.find("h1").text()).toBe("Hi");
    expect(wrapper.find("strong").text()).toBe("bold");
    expect(wrapper.find("em").text()).toBe("italic");
  });

  it("renders a list", () => {
    const wrapper = mount(Carve, { props: { source: "- one\n- two\n- three" } });
    const items = wrapper.findAll("ul > li");
    expect(items.length).toBe(3);
    expect(items[0].text()).toBe("one");
  });

  it("renders a link with the correct href", () => {
    const wrapper = mount(Carve, {
      props: { source: "[Carve](https://example.com)" },
    });
    const a = wrapper.find("a");
    expect(a.attributes("href")).toBe("https://example.com");
    expect(a.text()).toBe("Carve");
  });

  it("renders inline code", () => {
    const wrapper = mount(Carve, { props: { source: "use `npm ci` here" } });
    expect(wrapper.find("code").text()).toBe("npm ci");
  });

  it("does not throw on empty or whitespace source", () => {
    expect(() => mount(Carve, { props: { source: "" } })).not.toThrow();
    const wrapper = mount(Carve, { props: { source: "   " } });
    expect(wrapper.find("h1").exists()).toBe(false);
    expect(wrapper.element.tagName.toLowerCase()).toBe("div");
  });

  it("renders into a custom wrapper element via `as`", () => {
    const wrapper = mount(Carve, {
      props: { source: "*x*", as: "section" },
    });
    expect(wrapper.element.tagName.toLowerCase()).toBe("section");
    expect(wrapper.find("strong").text()).toBe("x");
  });

  it("reacts to source prop changes", async () => {
    const wrapper = mount(Carve, { props: { source: "# First" } });
    expect(wrapper.find("h1").text()).toBe("First");
    await wrapper.setProps({ source: "# Second" });
    expect(wrapper.find("h1").text()).toBe("Second");
  });

  it("useCarveHtml composable returns reactive HTML", () => {
    const source = ref("# Title");
    const html = useCarveHtml(source);
    expect(html.value).toBe(renderCarveHtml("# Title"));
    expect(html.value).toContain("<h1>Title</h1>");
    source.value = "# Other";
    expect(html.value).toContain("<h1>Other</h1>");
  });

  it("escapes a hostile raw-HTML/script input by default (no live script)", () => {
    const hostile =
      "`<img src=x onerror=alert(1)>`{=html}\n\n```=html\n<script>alert(2)</script>\n```";
    const wrapper = mount(Carve, { props: { source: hostile } });
    expect(wrapper.find("script").exists()).toBe(false);
    expect(wrapper.find("img").exists()).toBe(false);
    expect(wrapper.html()).toContain("&lt;script&gt;");
  });

  it("blanks a javascript: URL scheme (carve-js URL sanitization passthrough)", () => {
    const wrapper = mount(Carve, {
      props: { source: "[x](javascript:alert(1))" },
    });
    const a = wrapper.find("a");
    expect(a.exists()).toBe(true);
    expect(a.attributes("href")).toBe("");
  });
});
