import * as esbuild from "esbuild";

const result = await esbuild.build({
  entryPoints: ["./src/index.ts"],
  bundle: true,
  platform: "node",
  external: ["yargs", "glob", "esbuild", "fs-extra"],
  outfile: "./bin/lcbuild.js",
});

console.log("Build complete");

console.log(JSON.stringify(result, null, 2));
