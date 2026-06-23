import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    "core/index": "src/core/index.ts",
    "react/index": "src/react/index.ts",
    "vue/index": "src/vue/index.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  // carve-js is ESM-only (no `require` export condition), so we bundle it into
  // the output. That lets the CJS build work without a runtime `require()` of
  // an ESM-only package. react/vue stay external (peer deps).
  noExternal: ["@markup-carve/carve"],
  external: ["react", "react-dom", "react/jsx-runtime", "vue"],
  outExtension({ format }) {
    return { js: format === "cjs" ? ".cjs" : ".js" };
  },
});
