import * as fs from "node:fs";
import * as path from "node:path";
import { printOkGreen, printWarn } from "./printFunctions";

export type ConfigData = {
  fullAddonName: string;
  shortAddonName: string;
  behaviorPackName: string;
  resourcePackName: string;
};

const CONFIG_FILE_PATH = path.join(process.cwd(), "lcbuild-config.json");

function getDefaultConfigData(): ConfigData {
  return {
    fullAddonName: "MyUntitledAddon",
    shortAddonName: "MUA",
    behaviorPackName: "MUA_BP",
    resourcePackName: "MUA_RP",
  };
}

function saveConfig(data: ConfigData): void {
  let json = JSON.stringify(data, null, 2);

  fs.writeFileSync(CONFIG_FILE_PATH, json + "\n", { encoding: "utf-8" });

  printOkGreen(`Saved config file at ${CONFIG_FILE_PATH}`);
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

  printOkGreen(`Loaded config file at ${CONFIG_FILE_PATH}`);

  return data;
}

export const CONFIG_DATA = loadConfig();
