import * as child_process from "node:child_process";
import * as esbuild from "esbuild";

console.log("Build started...");

child_process.execSync("tsc", {
  cwd: process.cwd(),
  shell: true,
});

// await esbuild.build({
//   entryPoints: ["src/cli/cli.ts"],
//   bundle: true,
//   minify: false,
//   platform: "node",
//   external: ["esbuild", "fs-extra", "ignore", "pino", "typescript", "yargs"],
//   outfile: "dist/cli/cli.js",
// });

console.log("Build finished!");
