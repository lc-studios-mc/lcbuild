import * as fs from "fs-extra";
import * as path from "node:path";
import { CONFIG_DATA } from "./config";
import { printOkCyan } from "./printFunctions";

export namespace ProjectPaths {
  export const PROJ_DIR = process.cwd();

  export const SRC_DIR = path.join(PROJ_DIR, "src");
  export const SRC_PACKS_DIR = path.join(SRC_DIR, "packs");
  export const SRC_BP_DIR = path.join(SRC_PACKS_DIR, CONFIG_DATA.behaviorPackDirectoryName);
  export const SRC_RP_DIR = path.join(SRC_PACKS_DIR, CONFIG_DATA.resourcePackDirectoryName);
  export const SRC_SCRIPTS_DIR = path.join(SRC_DIR, "scripts");

  export const TEMP_DIR = path.join(PROJ_DIR, "temp");

  export const OUTPUT_DIR = path.join(PROJ_DIR, "output");
  export const OUTPUT_DEV_DIR = path.join(OUTPUT_DIR, "dev");
  export const OUTPUT_RELEASE_DIR = path.join(OUTPUT_DIR, "release");
}

function mkdirIfAbsent(dirpath: string): boolean {
  if (fs.existsSync(dirpath)) return false;
  fs.mkdirSync(dirpath, { recursive: true });
  printOkCyan(`Created directory at ${dirpath}`);
  return true;
}

mkdirIfAbsent(ProjectPaths.SRC_BP_DIR);
mkdirIfAbsent(ProjectPaths.SRC_RP_DIR);
mkdirIfAbsent(ProjectPaths.SRC_SCRIPTS_DIR);
