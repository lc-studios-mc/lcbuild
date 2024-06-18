import * as path from "node:path";
import * as fs from "fs-extra";

export const PROJ_DIR = process.cwd();

export const LCBUILD_DIR = path.join(PROJ_DIR, ".lcbuild");
export const MANIFEST_TEMPLATES_DIR = path.join(LCBUILD_DIR, "manifest_templates");

fs.ensureDirSync(LCBUILD_DIR);
fs.ensureDirSync(MANIFEST_TEMPLATES_DIR);

const GITIGNORE_FILE = path.join(LCBUILD_DIR, ".gitignore");

if (!fs.existsSync(GITIGNORE_FILE)) {
  fs.writeFileSync(GITIGNORE_FILE, `logs/\n`, { encoding: "utf-8" });
}

import { CONFIG_DATA } from "./config";

export const TEMP_DIR = path.join(PROJ_DIR, "temp");
export const TEMP_BP_DIR = path.join(TEMP_DIR, CONFIG_DATA.behaviorPackDirectoryName);
export const TEMP_BP_SCRIPTS_DIR = path.join(TEMP_BP_DIR, "scripts");
export const TEMP_SCRIPTS_DIR = path.join(
  TEMP_DIR,
  `${CONFIG_DATA.behaviorPackDirectoryName}_scripts`,
);
export const TEMP_RP_DIR = path.join(TEMP_DIR, CONFIG_DATA.resourcePackDirectoryName);
