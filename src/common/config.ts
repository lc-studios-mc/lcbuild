import * as fs from "fs-extra";
import * as path from "node:path";
import * as projectPaths from "./projectPaths";
import { LOGGER } from "../logger";
import { printOkCyan, printWarn } from "./printFunctions";

export type ConfigData = {
  fullAddonName: string;
  shortAddonName: string;
  behaviorPackDirectoryName: string;
  resourcePackDirectoryName: string;
  minifyBundle: boolean;
  externalModules: string[];
  entryScriptFileName: string;
};

const CONFIG_FILE_PATH = path.join(projectPaths.LCBUILD_DIR, "config.json");

function getDefaultConfigData(): ConfigData {
  const cwdBasename = path.basename(process.cwd());
  const cwdBasenameSliced = cwdBasename.slice(0, 5);
  return {
    fullAddonName: cwdBasename,
    shortAddonName: cwdBasename.slice(0, 5),
    behaviorPackDirectoryName: `${cwdBasenameSliced}_BP`,
    resourcePackDirectoryName: `${cwdBasenameSliced}_RP`,
    minifyBundle: false,
    externalModules: ["@minecraft"],
    entryScriptFileName: "main",
  };
}

function saveConfig(data: ConfigData): void {
  const json = JSON.stringify(data, null, 2);

  fs.writeFileSync(CONFIG_FILE_PATH, json + "\n", { encoding: "utf-8" });

  LOGGER.info(`Saved config file at ${CONFIG_FILE_PATH}`);
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
