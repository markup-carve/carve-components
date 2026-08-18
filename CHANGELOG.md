# Changelog

Notable changes to `carve-components`.

Rendering is done by the Carve engine (`@markup-carve/carve`), so an engine
change can alter output with no plugin diff. Engine bumps therefore get an
entry of their own.

## 0.1.0 - 2026-08-18

First release.

### Added

- React and Vue 3 components rendering Carve markup to HTML through carve-js.
- Subpath exports `./react`, `./vue` and `./core`, so a React app never loads
  Vue and vice versa. `react`/`react-dom` (>=18) and `vue` (>=3) are optional
  peer dependencies.

### Security

- Requires the Carve engine `@markup-carve/carve` >= 0.1.4 (`^0.1.4`). 0.1.4 is a
  security release: a list-valued URL attribute was only probed on its first
  entry, so `srcset="safe.png 1x, javascript:alert(1) 2x"` passed sanitization
  on the second one. Nothing published from this repo ever carried the older
  engine, so this is a floor rather than a fix for an installed version.
