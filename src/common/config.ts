import * as fs from "fs-extra";
import * as path from "node:path";
import * as os from "node:os";
import * as projectPaths from "./projectPaths.js";
import { printOkCyan, printWarn } from "./printFunctions.js";

export type ConfigData = {
  minecraftComMojangDirectoryPath: string;
  fullAddonName: string;
  shortAddonName: string;
  behaviorPackDirectoryName: string;
  resourcePackDirectoryName: string;
  externalModules: string[];
  entryScriptFileName: string;
  compilationIgnorePatterns: string[];
};

const CONFIG_FILE_PATH = path.join(projectPaths.LCBUILD_DIR, "config.json");

function getDefaultConfigData(): ConfigData {
  const cwdBasename = path.basename(process.cwd());
  const cwdBasenameSliced = cwdBasename.slice(0, 5);
  return {
    minecraftComMojangDirectoryPath: path.join(
      os.homedir(),
      "AppData\\Local\\Packages\\Microsoft.MinecraftUWP_8wekyb3d8bbwe\\LocalState\\games\\com.mojang",
    ),
    fullAddonName: cwdBasename,
    shortAddonName: cwdBasename.slice(0, 5),
    behaviorPackDirectoryName: `${cwdBasenameSliced}_BP`,
    resourcePackDirectoryName: `${cwdBasenameSliced}_RP`,
    externalModules: ["@minecraft"],
    entryScriptFileName: "main",
    compilationIgnorePatterns: [
      "**/.git",
      "**/.gitignore",
      "**/.gitkeep",
      "**/node_modules",
      "**/*.bbmodel",
      "**/*.psd",
      "**/*.gif",
    ],
  };
}

function saveConfig(data: ConfigData): void {
  const json = JSON.stringify(data, null, 2);

  fs.writeFileSync(CONFIG_FILE_PATH, json + "\n", { encoding: "utf-8" });
}

function loadConfig(): ConfigData {
  let data = getDefaultConfigData();

  if (!fs.existsSync(CONFIG_FILE_PATH)) {
    printWarn(`Config file does not exist at ${CONFIG_FILE_PATH}.
Using default options:
${JSON.stringify(data, null, 2)}
`);

    saveConfig(data);

    return data;
  }

  let json: string = fs.readFileSync(CONFIG_FILE_PATH).toString();
  let readData: {} = JSON.parse(json);

  Object.assign(data, readData);

  printOkCyan(`Loaded config file at ${CONFIG_FILE_PATH}`);

  return data;
}

export const CONFIG_DATA = loadConfig();
