# Changelog

Notable changes to `carve-components`.

Rendering is done by the Carve engine (`@markup-carve/carve`), so an engine
change can alter output with no plugin diff. Engine bumps therefore get an
entry of their own.

## [Unreleased]

## 0.1.2 - 2026-10-08

### Added

- `renderCarveHtmlWithReport`, exported from `./core`, `./react` and `./vue`:
  the same HTML as `renderCarveHtml` plus carve-js's render-loss report. It is
  the only way to see that URL sanitization blanked a destination, which the
  HTML records as nothing more than an empty `href`. carve-js 0.1.10 added the
  `destination-denied` loss row this surfaces.
- `CARVE_ENGINE_VERSION` and `CARVE_SPEC_VERSION`. The engine is bundled into
  `dist/`, so a consumer could not previously tell which engine rendered their
  page or name one in a bug report.

### Fixed

- A fallthrough `innerHTML` attribute on the Vue `<Carve>` replaced the
  rendered HTML, so an attribute bag spread onto the component could put
  unsanitized markup in the wrapper. Attributes are now applied before the
  rendered HTML, as the React component already did. Ordinary attributes
  (`class`, `id`, `data-*`) still fall through.

### Changed

- The carve-js engine is now a runtime dependency rather than a development one.
  `dist/` still bundles it, so the installed copy serves only the published
  declarations, which import the engine by name and could not resolve for a
  consumer type-checking with `skipLibCheck: false`. The installed copy can be a
  newer 0.1.x than the one compiled in, which is what `CARVE_ENGINE_VERSION`
  reports (#24)
- Bundles carve-js 0.1.10, where 0.1.1 bundled 0.1.7. A list item now ends on a
  block the author wrote past its content column, so a flush-left line below an
  over-indented heading, table row or thematic break renders as a document-level
  paragraph instead of folding into the item. See the carve-js changelog for
  0.1.8, 0.1.9 and 0.1.10 (#23).

## 0.1.1 - 2026-09-21

### Changed

- Bundles carve-js 0.1.7, where 0.1.0 bundled 0.1.4 (#15). The build compiles
  the engine into `dist/`, so rendered output follows it; see the carve-js
  changelog for 0.1.5, 0.1.6 and 0.1.7.

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
