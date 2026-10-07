import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { render, cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { computed, ref } from "vue";
import {
  Carve as ReactCarve,
  useCarveHtml as useReactCarveHtml,
} from "../src/react/index.js";
import {
  Carve as VueCarve,
  useCarveHtml as useVueCarveHtml,
} from "../src/vue/index.js";
import { SAFE_DEFAULTS, renderCarveHtml } from "../src/core/index.js";

afterEach(cleanup);

// A caller option only proves it reached the engine if the engine renders
// something it cannot render without it. `allowRawHtml` is that lever: the
// library's own default escapes the raw-HTML author form, so a live <b> in the
// output is only possible when the option travelled the whole way.
const RAW = "`<b>live</b>`{=html}";

describe("options reach the engine", () => {
  it("SAFE_DEFAULTS escape raw HTML, and a caller option overrides them", () => {
    expect(renderCarveHtml(RAW)).toContain("&lt;b&gt;");
    expect(renderCarveHtml(RAW, { allowRawHtml: true })).toContain("<b>live</b>");
    expect(SAFE_DEFAULTS.allowRawHtml).toBe(false);
  });

  it("React <Carve> forwards the options prop", () => {
    const { container } = render(
      createElement(ReactCarve, { source: RAW, options: { allowRawHtml: true } }),
    );
    expect(container.querySelector("b")?.textContent).toBe("live");
  });

  it("React <Carve> without the prop keeps the safe default", () => {
    const { container } = render(createElement(ReactCarve, { source: RAW }));
    expect(container.querySelector("b")).toBeNull();
  });

  it("React useCarveHtml forwards options", () => {
    function Probe() {
      return createElement("output", {
        "data-html": useReactCarveHtml(RAW, { allowRawHtml: true }),
      });
    }
    const { container } = render(createElement(Probe));
    expect(container.querySelector("output")?.getAttribute("data-html")).toContain(
      "<b>live</b>",
    );
  });

  it("Vue <Carve> forwards the options prop", () => {
    const wrapper = mount(VueCarve, {
      props: { source: RAW, options: { allowRawHtml: true } },
    });
    expect(wrapper.find("b").exists()).toBe(true);
    expect(wrapper.find("b").text()).toBe("live");
  });

  it("Vue <Carve> without the prop keeps the safe default", () => {
    const wrapper = mount(VueCarve, { props: { source: RAW } });
    expect(wrapper.find("b").exists()).toBe(false);
  });

  it("Vue <Carve> re-renders when the options prop changes", async () => {
    const wrapper = mount(VueCarve, { props: { source: RAW } });
    expect(wrapper.find("b").exists()).toBe(false);
    await wrapper.setProps({ options: { allowRawHtml: true } });
    expect(wrapper.find("b").exists()).toBe(true);
  });

  it("Vue useCarveHtml forwards options as a value, a ref and a getter", () => {
    const opts = { allowRawHtml: true };
    expect(useVueCarveHtml(RAW, opts).value).toContain("<b>live</b>");
    expect(useVueCarveHtml(RAW, ref(opts)).value).toContain("<b>live</b>");
    expect(useVueCarveHtml(RAW, () => opts).value).toContain("<b>live</b>");
    const reactive = ref<{ allowRawHtml: boolean } | undefined>(undefined);
    const html = computed(() => useVueCarveHtml(RAW, reactive).value);
    expect(html.value).not.toContain("<b>live</b>");
    reactive.value = opts;
    expect(html.value).toContain("<b>live</b>");
  });
});

describe("React and Vue render the same HTML", () => {
  const cases: Record<string, string> = {
    heading: "# Hi\n\n*bold* and /italic/",
    list: "- one\n- two",
    link: "[Carve](https://example.com)",
    denied: "[x](javascript:alert(1))",
    hostile: "```=html\n<script>alert(1)</script>\n```",
    table: "| a | b |\n|---|---|\n| 1 | 2 |",
    footnote: "x[^1]\n\n[^1]: note",
  };

  for (const [name, source] of Object.entries(cases)) {
    it(`agrees on ${name}`, () => {
      const { container } = render(createElement(ReactCarve, { source }));
      const reactHtml = (container.firstElementChild as HTMLElement).innerHTML;
      const vueHtml = mount(VueCarve, { props: { source } }).element.innerHTML;
      expect(vueHtml).toBe(reactHtml);
      // Leave-one-out: the comparison is only meaningful while it can fail.
      const other = renderCarveHtml(source + "\n\n# sentinel");
      expect((container.firstElementChild as HTMLElement).innerHTML).not.toBe(
        other,
      );
    });
  }
});

describe("fallthrough attributes cannot replace the rendered HTML", () => {
  it("Vue: an innerHTML attribute loses to the Carve output", () => {
    const wrapper = mount(VueCarve, {
      props: { source: "# Hi" },
      attrs: { innerHTML: "<p>injected</p>" },
    });
    expect(wrapper.html()).not.toContain("injected");
    expect(wrapper.find("h1").text()).toBe("Hi");
  });

  it("Vue: ordinary attributes still fall through", () => {
    const wrapper = mount(VueCarve, {
      props: { source: "# Hi" },
      attrs: { class: "prose", id: "doc", "data-x": "1" },
    });
    expect(wrapper.attributes("class")).toBe("prose");
    expect(wrapper.attributes("id")).toBe("doc");
    expect(wrapper.attributes("data-x")).toBe("1");
    expect(wrapper.find("h1").exists()).toBe(true);
  });

  it("React: a dangerouslySetInnerHTML prop loses to the Carve output", () => {
    const { container } = render(
      createElement(
        ReactCarve as unknown as (p: Record<string, unknown>) => JSX.Element,
        {
          source: "# Hi",
          dangerouslySetInnerHTML: { __html: "<p>injected</p>" },
        },
      ),
    );
    expect(container.innerHTML).not.toContain("injected");
    expect(container.querySelector("h1")?.textContent).toBe("Hi");
  });
});
