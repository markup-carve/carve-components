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

| Hostile input                          | Default component output         |
| -------------------------------------- | -------------------------------- |
| `[x](javascript:alert(1))`             | `<a href="">x</a>` (inert)       |
| `` `<script>...`{=html} ``             | escaped text (`&lt;script&gt;`)  |
| ` ```=html ` block with `<script>`     | escaped text                     |
| bare `<script>...</script>` line       | escaped text                     |

## carve-js dependency (bundled)

carve-js (`@markup-carve/carve`) is a **build-time** dependency only: `tsup`
bundles it into this package's `dist/` (`noExternal`), so the published package
is self-contained and consumers do not install carve-js separately. It is
therefore a `devDependency` (pinned to a carve-js git commit), not a runtime
dependency. Bump the pinned commit in `devDependencies` and rebuild to pick up a
newer engine.
