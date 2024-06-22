import * as child_process from "node:child_process";

console.log("Build started...");

child_process.execSync("npx tsc", {
  cwd: process.cwd(),
  shell: true,
});

console.log("Build finished!");
