# carve-components

React and Vue 3 components that render Carve 0.2 source to safe HTML, powered
by the pinned carve-js 0.2 engine branch.

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

<Carve source="= Hello\n\n*bold* and /italic/" />
<Carve source={src} as="article" className="prose" options={{ rawHtml: true }} />

const html = useCarveHtml(src); // memoized HTML string
```

`<Carve>` accepts `source` (required), `options` (Carve 0.2 `RenderOptions`), `as`
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
  <Carve :source="src" as="article" :options="{ rawHtml: true }" />
</template>
```

`<Carve>` accepts `:source` (required), `:options`, and `:as` (default `div`).
The HTML is injected via `v-html`. Extra attributes fall through to the wrapper.

## SSR

Both components are server-render safe: carve-js is isomorphic and there is no
`window`/`document` access at module scope. Use `react-dom/server`'s
`renderToString` or `@vue/server-renderer` as usual.

## Security model

The engine escapes ordinary text and checks link and image URLs. This library
injects the resulting HTML without another escaping pass. Two render options
matter:

- **URL policy** (`urlPolicy`): the default deny list blanks dangerous schemes,
  including `javascript:`, `vbscript:`, `data:` and `file:`, in links and images.
  The component pins that list through the engine's `DEFAULT_DENIED_SCHEMES`.
  A caller can supply a different `{ deny: [...] }` or `{ allow: [...] }` policy.
- **Raw HTML** (`rawHtml`): the 0.2 default is `false`, and this package pins it
  off. Explicit raw HTML forms are escaped as text. Setting `rawHtml: true`
  passes author supplied HTML through unchanged and requires trusted input.

If you fully trust the input and want raw-HTML passthrough, pass
`options={{ rawHtml: true }}`.

### Knowing what was blanked

A blanked URL leaves no trace in the HTML beyond an empty `href`.
`renderCarveHtmlWithReport` returns the engine's `RenderOutput`: `html`,
`diagnostics` and `suppressedDiagnostics`. Diagnostics include parse messages
and render losses, so an application can log or warn about denied destinations.

```ts
import { renderCarveHtmlWithReport } from "@markup-carve/carve-components/core";

const { html, diagnostics } = renderCarveHtmlWithReport(source);
for (const entry of diagnostics) {
  if (entry.channel === "render-loss") console.warn(entry.code, entry.message, entry.range);
}
```

`strictLosses: true` throws from `renderCarveHtml`; the diagnostic call returns
an empty `html` string and error diagnostics when content is lost.

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
which import the engine's `RenderOptions` and `RenderOutput` types, so a
consumer gets an installed copy that TypeScript resolves. The dependency is
pinned to a commit on the engine's `next2` branch; it is not a registry release.
The installed git package builds its entries during npm installation.

Because the engine is compiled in, read `CARVE_ENGINE_VERSION` and
`CARVE_SPEC_VERSION` from the component package to identify its engine and
specification line:

```ts
import { CARVE_ENGINE_VERSION } from "@markup-carve/carve-components/react";
```
