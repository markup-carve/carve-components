# carve-components

React and Vue 3 components that render [Carve](https://markup-carve.github.io/carve/)
markup to safe HTML, powered by carve-js. This fills a gap that the djot
ecosystem does not cover: ready-made framework components for rendering the
markup.

## Install

```bash
npm install @markup-carve/carve-components react react-dom   # React
npm install @markup-carve/carve-components vue               # Vue
```

`react` / `react-dom` (>=18) and `vue` (>=3) are optional peer dependencies.
Pull in only the framework you use; the subpath exports keep a React app from
ever loading Vue and vice versa.

## React

```tsx
import { Carve, useCarveHtml } from "@markup-carve/carve-components/react";

<Carve source="# Hello\n\n*bold* and /italic/" />
<Carve source={src} as="article" className="prose" options={{ allowRawHtml: true }} />

const html = useCarveHtml(src); // memoized HTML string
```

`<Carve>` accepts `source` (required), `options` (carve-js options), `as`
(wrapper element, default `div`), plus any extra props (`className`, `id`,
`style`, ...) and a forwarded `ref` that fall through to the wrapper. The HTML
is injected via `dangerouslySetInnerHTML`.

## Vue

```vue
<script setup lang="ts">
import { Carve, useCarveHtml } from "@markup-carve/carve-components/vue";
const html = useCarveHtml(() => src);
</script>

<template>
  <Carve :source="src" as="article" :options="{ allowRawHtml: true }" />
</template>
```

`<Carve>` accepts `:source` (required), `:options`, and `:as` (default `div`).
The HTML is injected via `v-html`. Extra attributes fall through to the wrapper.

## SSR

Both components are server-render safe: carve-js is isomorphic and there is no
`window`/`document` access at module scope. Use `react-dom/server`'s
`renderToString` or `@vue/server-renderer` as usual.

## Security model

carve-js sanitizes its own output (the project's defenses are normative), so the
rendered HTML is meant to be injected directly. This library does not re-escape
it. Two carve-js knobs matter:

- **URL sanitization** (`sanitizeUrls`, carve-js default `true`, pinned on
  here): dangerous link/image schemes (`javascript:`, `vbscript:`, `data:`,
  `file:`) are blanked to `""`. The link text / image alt still render but are
  inert.
- **Raw HTML** (`allowRawHtml`): carve-js defaults this to `true` to match its
  conformance corpus, which means the explicit raw-HTML author forms
  (`` `…`{=html} `` inline and ` ```=html ` block) emit verbatim and CAN inject
  a live `<script>`. **This library overrides the default to `false`** so the
  components are safe by default for untrusted input - raw HTML is escaped to
  text. A bare `<script>` line in plain Carve is always escaped regardless of
  this flag.

If you fully trust the input and want raw-HTML passthrough, pass
`options={{ allowRawHtml: true }}`.

### Knowing what was blanked

A blanked URL leaves no trace in the HTML beyond an empty `href`.
`renderCarveHtmlWithReport` returns the same HTML with carve-js's render-loss
report beside it, so an application can log or warn instead of silently
serving an inert link.

```ts
import { renderCarveHtmlWithReport } from "@markup-carve/carve-components/core";

const { value, losses } = renderCarveHtmlWithReport(source);
for (const loss of losses) {
  // { code: "destination-denied", message: "Blanked a denied destination scheme", ... }
  console.warn(loss.code, loss.message, loss.pos);
}
```

`strictLosses: true` throws instead of returning, and `maxRenderLosses` caps
the rows while `totalLosses` keeps the full count.

| Hostile input                          | Default component output         |
| -------------------------------------- | -------------------------------- |
| `[x](javascript:alert(1))`             | `<a href="">x</a>` (inert)       |
| `` `<script>...`{=html} ``             | escaped text (`&lt;script&gt;`)  |
| ` ```=html ` block with `<script>`     | escaped text                     |
| bare `<script>...</script>` line       | escaped text                     |

## carve-js dependency (bundled)

carve-js (`@markup-carve/carve`) is a regular `dependency`, but the JavaScript
does not load it at runtime: `tsup` bundles the engine into this package's
`dist/` (`noExternal`). The dependency is there for the type declarations,
which import the engine's types (`CarveOptions`, `carveToHtml`, ...), so a
consumer gets an installed copy of carve-js that TypeScript resolves. Bump the
range in `dependencies`, refresh the lockfile and rebuild to pick up a newer
engine.

Because the engine is compiled in, its version cannot be read from the
consumer's dependency tree: the installed copy can be a newer release within
the range than the one in `dist/`. `CARVE_ENGINE_VERSION` (and `CARVE_SPEC_VERSION`)
report it, from every entry point:

```ts
import { CARVE_ENGINE_VERSION } from "@markup-carve/carve-components/react";
```
