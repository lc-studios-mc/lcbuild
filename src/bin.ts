#!/usr/bin/env node

import * as fs from "fs-extra";
import * as path from "node:path";
import yargs from "yargs";
import isValidPath from "is-valid-path";

class MessageError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export type BuildOptions = {
  configPath?: string;
  bpManifestTemplate?: string;
  rpManifestTemplate?: string;
};

type ConfigData = {
  buildOptions: BuildOptions;
  extends?: string;
};

const DEFAULT_BUILD_OPTIONS: BuildOptions = {} as const;

function getConfigData(configPath: string): ConfigData {
  if (!fs.existsSync(configPath)) {
    throw new MessageError(`Invalid config path: ${configPath}`);
  }

  const json = fs.readFileSync(configPath).toString();

  const data = JSON.parse(json, (key, value) => {
    if (key === "extends") {
      value = String(value);
    }
  });

  let returnObj: ConfigData;

  if ("extends" in data) {
    const parentConfigPath = data.extends as string;
    const parentData = getConfigData(parentConfigPath);

    const finalBuildOptions = Object.assign(
      structuredClone(DEFAULT_BUILD_OPTIONS),
      parentData.buildOptions,
      data.buildOptions ?? {},
    );

    returnObj = {
      buildOptions: finalBuildOptions,
      extends: data.extends,
    };
  } else {
    const finalBuildOptions = Object.assign(
      structuredClone(DEFAULT_BUILD_OPTIONS),
      data.buildOptions ?? {},
    );

    returnObj = {
      buildOptions: finalBuildOptions,
    };
  }

  return returnObj;
}

function createBuildOptionsFromArgv(): BuildOptions {
  const commandOptions = yargs
    .options({
      configPath: {
        description: "Path to config file. Command options will be prioritized.",
        type: "string",
      },
      saveConfigFile: {
        description: "Save config file to path.",
        type: "string",
      },
      bpManifestTemplate: {
        description: "Path to behavior pack manifest template file.",
        type: "string",
      },
      rpManifestTemplate: {
        description: "Path to resource pack manifest template file.",
        type: "string",
      },
    })
    .parseSync();

  let buildOptions: BuildOptions;

  if (commandOptions.configPath === undefined) {
    buildOptions = Object.assign(structuredClone(DEFAULT_BUILD_OPTIONS), commandOptions);
  } else {
    buildOptions = getConfigData(commandOptions.configPath).buildOptions;
  }

  if (commandOptions.saveConfigFile !== undefined) {
    let saveCfgFilePath: string;

    if (path.isAbsolute(commandOptions.saveConfigFile)) {
      saveCfgFilePath = commandOptions.saveConfigFile;
    } else {
      saveCfgFilePath = path.resolve(commandOptions.saveConfigFile);
    }

    if (!isValidPath(saveCfgFilePath)) {
      throw new MessageError(`Cannot save config file at invalid path: ${saveCfgFilePath}`);
    }

    const configData: ConfigData = {
      buildOptions: buildOptions,
    };

    const json = JSON.stringify(configData, (key, value) => {
      if (["configPath", "saveConfigFile"].includes(key)) {
        value = undefined;
      }
    });

    fs.writeFileSync(saveCfgFilePath, json, { encoding: "utf-8" });
  }

  return buildOptions;
}

export async function build(buildOptions?: BuildOptions): Promise<void> {}

export function buildSync(buildOptions?: BuildOptions): void {}

if (require.main === module) {
  const buildOptions = createBuildOptionsFromArgv();
  build(buildOptions);
}
