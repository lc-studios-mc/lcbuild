import * as path from "node:path";
import * as fs from "fs-extra";

export const PROJ_DIR = process.cwd();

export const LCBUILD_DIR = path.join(PROJ_DIR, ".lcbuild");
export const MANIFEST_TEMPLATES_DIR = path.join(LCBUILD_DIR, "manifest_templates");

fs.ensureDirSync(LCBUILD_DIR);
fs.ensureDirSync(MANIFEST_TEMPLATES_DIR);

import { CONFIG_DATA } from "./config.js";

export const SRC_DIR = path.join(PROJ_DIR, "src");
export const SRC_PACKS_DIR = path.join(SRC_DIR, "packs");
export const SRC_BP_DIR = path.join(SRC_PACKS_DIR, CONFIG_DATA.behaviorPackDirectoryName);
export const SRC_RP_DIR = path.join(SRC_PACKS_DIR, CONFIG_DATA.resourcePackDirectoryName);
export const SRC_SCRIPTS_DIR = path.join(SRC_DIR, "scripts");

export const TEMP_DIR = path.join(PROJ_DIR, "temp");
export const TEMP_BP_DIR = path.join(TEMP_DIR, CONFIG_DATA.behaviorPackDirectoryName);
export const TEMP_BP_SCRIPTS_DIR = path.join(TEMP_BP_DIR, "scripts");
export const TEMP_RP_DIR = path.join(TEMP_DIR, CONFIG_DATA.resourcePackDirectoryName);
export const TEMP_SCRIPTS_DIR = path.join(
  TEMP_DIR,
  `${CONFIG_DATA.behaviorPackDirectoryName}_scripts`,
);

export const OUTPUT_DIR = path.join(PROJ_DIR, "output");
export const OUTPUT_DEV_DIR = path.join(OUTPUT_DIR, "dev");
export const OUTPUT_DEV_BP_DIR = path.join(OUTPUT_DEV_DIR, CONFIG_DATA.behaviorPackDirectoryName);
export const OUTPUT_DEV_RP_DIR = path.join(OUTPUT_DEV_DIR, CONFIG_DATA.resourcePackDirectoryName);
export const OUTPUT_RELEASE_DIR = path.join(OUTPUT_DIR, "release");
