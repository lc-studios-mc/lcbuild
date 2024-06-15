import * as path from "node:path";
import { CONFIG_DATA } from "./config";

export namespace ProjectPaths {
  export const PROJ_DIR = process.cwd();

  export const SRC_DIR = path.join(PROJ_DIR, "src");
  export const SRC_PACKS_DIR = path.join(SRC_DIR, "packs");
  export const SRC_BP_DIR = path.join(SRC_PACKS_DIR, CONFIG_DATA.behaviorPackName);
  export const SRC_RP_DIR = path.join(SRC_PACKS_DIR, CONFIG_DATA.resourcePackName);

  export const OUTPUT_DIR = path.join(PROJ_DIR, "output");
  export const OUTPUT_DEV_DIR = path.join(OUTPUT_DIR, "dev");
  export const OUTPUT_RELEASE_DIR = path.join(OUTPUT_DIR, "release");
}
