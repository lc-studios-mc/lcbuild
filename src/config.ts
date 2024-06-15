import * as fs from "node:fs";
import * as path from "node:path";
import { printOkGreen, printWarn } from "./printFunctions";
import { v4 as uuidv4 } from "uuid";

export type ConfigData = {
  fullAddonName: string;
  shortAddonName: string;

  behaviorPackDirectoryName: string;
  behaviorPackHeaderDescription: string;
  devBuildBehaviorPackHeaderUuid: string;
  devBuildBehaviorPackModuleUuid: string;
  devBuildBehaviorPackScriptModuleUuid: string;

  resourcePackDirectoryName: string;
  resourcePackHeaderDescription: string;
  devBuildResourcePackHeaderUuid: string;
  devBuildResourcePackModuleUuid: string;

  minEngineVersion: number[];
};

const CONFIG_FILE_PATH = path.join(process.cwd(), "lcbuild-config.json");

function getDefaultConfigData(): ConfigData {
  return {
    fullAddonName: "My Untitled Addon",
    shortAddonName: "MUA",

    behaviorPackDirectoryName: "MUA_BP",
    behaviorPackHeaderDescription: "Behavior pack of my untitled addon",
    devBuildBehaviorPackHeaderUuid: uuidv4(),
    devBuildBehaviorPackModuleUuid: uuidv4(),
    devBuildBehaviorPackScriptModuleUuid: uuidv4(),

    resourcePackDirectoryName: "MUA_RP",
    resourcePackHeaderDescription: "Resource pack of my untitled addon",
    devBuildResourcePackHeaderUuid: uuidv4(),
    devBuildResourcePackModuleUuid: uuidv4(),

    minEngineVersion: [1, 21, 0],
  };
}

function saveConfig(data: ConfigData): void {
  let json = JSON.stringify(data, null, 2);

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

  saveConfig(data);

  printOkGreen(`Loaded config file at ${CONFIG_FILE_PATH}`);

  return data;
}

export const CONFIG_DATA = loadConfig();
