// Packs the built package, installs the tarball into a fresh project, and
// type-checks ESM and CJS consumers of every entry point with
// `skipLibCheck: false`. The published declarations import the carve-js engine,
// so it must arrive as a dependency of the tarball. Run after `npm run build`.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ENGINE = "@markup-carve/carve";
const root = fileURLToPath(new URL("..", import.meta.url));
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const dev = pkg.devDependencies;
const work = mkdtempSync(join(tmpdir(), "carve-components-packed-"));

const run = (cmd, args, cwd) =>
  execFileSync(cmd, args, { cwd, stdio: ["ignore", "pipe", "inherit"], encoding: "utf8" });

let failed = false;
try {
  const packed = JSON.parse(run("npm", ["pack", "--json", "--pack-destination", work], root));
  // npm 12 keys the pack report by package name; earlier majors return an array.
  const entry = Array.isArray(packed) ? packed[0] : packed[pkg.name];
  const tarball = join(work, entry.filename);

  const project = join(work, "consumer");
  mkdirSync(project);
  writeFileSync(
    join(project, "package.json"),
    JSON.stringify({
      name: "consumer",
      private: true,
      type: "module",
      allowScripts: { [pkg.dependencies[ENGINE]]: true },
    }),
  );
  run(
    "npm",
    [
      "install",
      "--no-audit",
      "--no-fund",
      "--allow-git=all",
      tarball,
      `typescript@${dev.typescript}`,
      `react@${dev.react}`,
      `react-dom@${dev["react-dom"]}`,
      `@types/react@${dev["@types/react"]}`,
      `vue@${dev.vue}`,
    ],
    project,
  );

  try {
    statSync(join(project, "node_modules", ...ENGINE.split("/"), "package.json"));
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
    console.error(`${ENGINE} was not installed with the tarball; its declarations import it`);
    failed = true;
  }

  writeFileSync(
    join(project, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        module: "NodeNext",
        moduleResolution: "NodeNext",
        target: "ES2022",
        strict: true,
        skipLibCheck: false,
        noEmit: true,
        jsx: "react-jsx",
        types: [],
      },
      include: ["*.ts", "*.cts", "*.tsx"],
    }),
  );
  const consumer = (load) => `
${load("core", "{ render, renderWithDiagnostics, renderCarveHtml, renderCarveHtmlWithReport, type CarveOptions, type CarveRenderResult }")}
${load("react", "{ Carve as ReactCarve }")}
${load("vue", "{ Carve as VueCarve }")}

const options: CarveOptions = { rawHtml: false, urlPolicy: { deny: ["javascript"] } };
const html: string = render("*hi*", options);
const report: CarveRenderResult = renderWithDiagnostics("*hi*", options);
const value: string = report.html;
const safe: string = renderCarveHtml("*hi*", options);
const checked: CarveRenderResult = renderCarveHtmlWithReport("*hi*", options);
// Fails as an unused directive if the option types collapsed to \`any\`.
// @ts-expect-error urlPolicy is an object
const wrong: CarveOptions = { urlPolicy: "yes" };
export const used = [html, value, safe, checked, wrong, ReactCarve, VueCarve];
`;
  writeFileSync(
    join(project, "esm.ts"),
    consumer((sub, names) => `import ${names} from "${pkg.name}/${sub}";`),
  );
  writeFileSync(
    join(project, "cjs.cts"),
    consumer((sub, names) => `import ${names} from "${pkg.name}/${sub}";`),
  );

  try {
    run(join(project, "node_modules", ".bin", "tsc"), ["-p", "tsconfig.json"], project);
  } catch (err) {
    console.error(err.stdout);
    failed = true;
  }
} finally {
  console.log(`Packed type check workspace: ${work}`);
}

if (failed) {
  console.error("packed types check FAILED");
  process.exit(1);
}
console.log("packed types check passed");
