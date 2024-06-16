#!/usr/bin/env node

import { print, printError, printOkCyan, printOkGreen, printWarn } from "./printFunctions";
import {
  ReleaseStage,
  ReleaseVersion,
  VALID_RELEASE_STAGES,
  isStringValidReleaseStage,
} from "./releaseVersion";
import * as child_process from "node:child_process";
import * as path from "node:path";
import * as fs from "fs-extra";
import * as yargs from "yargs";
import * as glob from "glob";
import * as esbuild from "esbuild";
import { MessageError } from "./errorTypes";
import { ProjectPaths } from "./projectPaths";
import { CONFIG_DATA } from "./config";

namespace BuildFunctions {
  function runCommand(
    cmd: string,
    args: string[],
    options: child_process.SpawnOptionsWithoutStdio,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = child_process.spawn(cmd, args, options);

      let data = "";
      child.stdout.on("data", (chunk: Buffer) => (data += chunk));
      child.stderr.on("data", (chunk: Buffer) => (data += chunk));

      child.on("close", (code: number) => {
        if (code === 0) {
          resolve(data);
        } else {
          reject(new Error(`Command exited with code ${code}: ${data}`));
        }
      });
    });
  }

  export async function compileTypeScript(): Promise<void> {
    print("Compiling TypeScript scripts...");

    try {
      if (!(await fs.exists(path.join(ProjectPaths.SRC_SCRIPTS_DIR, "main.ts")))) {
        throw new Error("No TypeScript file named main.ts is in the src scripts directory");
      }

      await runCommand("tsc", ['--outDir "./temp"', "--noEmit false"], {
        cwd: process.cwd(),
        shell: true,
      });
    } catch (error) {
      throw new MessageError(`Failed to compile TypeScript scripts.\n${error}`);
    }
  }

  export async function bundleScriptsInTempDir(): Promise<void> {
    print("Bundling scripts...");

    try {
      await esbuild.build({
        entryPoints: [path.join(ProjectPaths.TEMP_DIR, "main.js")],
        external: CONFIG_DATA.externalModules,
        bundle: true,
        minify: true,
        format: "esm",
        allowOverwrite: true,
        outfile: path.join(ProjectPaths.TEMP_DIR, "main.js"),
      });
    } catch (error) {
      throw new MessageError(`Failed to bundle scripts.\n${error}`);
    }
  }
}

type BuildOptions = {
  copyPacksToMc: boolean;
  bundleScripts: boolean;
};

type ReleaseBuildOptions = BuildOptions & {
  createZipArchive: boolean;
  createMcadddonArchive: boolean;
};

async function dev(buildOptions: BuildOptions): Promise<void> {
  printWarn("Build started... (Dev)");

  try {
    await BuildFunctions.compileTypeScript();

    if (buildOptions.bundleScripts) {
      await BuildFunctions.bundleScriptsInTempDir();
    }
  } catch (error) {
    if (error instanceof MessageError) {
      printError(error.message);
      return;
    }
  }

  printOkGreen("Build finished!");
}

async function release(
  releaseVersion: ReleaseVersion,
  buildOptions: ReleaseBuildOptions,
): Promise<void> {
  printWarn("Build started... (Release)");

  printOkGreen("Build finished!");
}

yargs.command({
  command: "dev",
  describe: "Compiles the addon in dev mode",
  builder: {
    copytomc: {
      describe: "Choose whether to copy compiled packs to Minecraft",
      demandOption: false,
      type: "boolean",
    },
    bundle: {
      describe: "Choose whether to bundle and minify JavaScript script output files",
      demandOption: false,
      type: "boolean",
    },
  },
  handler(argv) {
    dev({
      copyPacksToMc: argv.copytomc === true,
      bundleScripts: argv.bundle === true,
    });
  },
});

yargs.command({
  command: "release",
  describe: "Compiles the addon in release mode",
  builder: {
    ver: {
      describe: "Version as number array [Major, Minor, Patch]",
      demandOption: true,
      type: "array",
    },
    stage: {
      describe: `Release stage of the addon. Valid value: ${Object.keys(VALID_RELEASE_STAGES)}`,
      demandOption: true,
      type: "string",
    },
    iter: {
      describe: "Optional release index/iteration",
      demandOption: false,
      type: "number",
    },
    copytomc: {
      describe: "Choose whether to copy compiled packs to Minecraft",
      demandOption: false,
      type: "boolean",
    },
    bundle: {
      describe: "Choose whether to bundle and minify JavaScript script output files",
      demandOption: false,
      type: "boolean",
    },
    createzip: {
      describe: "Choose whether to create .zip archive of compiled packs",
      demandOption: false,
      type: "boolean",
    },
    createmcaddon: {
      describe: "Choose whether to create .mcaddon archive of compiled packs",
      demandOption: false,
      type: "boolean",
    },
  },
  handler(argv) {
    const ver: number[] = (function (): number[] {
      function getVersionNumber(value: any): number {
        if (isNaN(value) || typeof value !== "number") {
          printError(`${argv.ver[0]} is not a number!`);
          throw new Error();
        }

        return value;
      }

      const major = getVersionNumber(argv.ver[0]);
      const minor = getVersionNumber(argv.ver[1]);
      const patch = getVersionNumber(argv.ver[2]);

      return [major, minor, patch];
    })();

    const stage: ReleaseStage = (function (): ReleaseStage {
      const value = argv.stage;

      if (typeof value !== "string" || !isStringValidReleaseStage(value)) {
        printError(
          `${value} is not a valid release stage string! Valid value: ${Object.keys(
            VALID_RELEASE_STAGES,
          )}`,
        );
        throw new Error();
      }

      return value as ReleaseStage;
    })();

    const iter: number = typeof argv.iter === "number" && argv.iter > 0 ? argv.iter : 1;

    const releaseVersion = new ReleaseVersion(ver, stage, iter);

    printOkCyan(`Successfully created version object: ${releaseVersion.toString()}`);

    release(releaseVersion, {
      copyPacksToMc: argv.copytomc === true,
      bundleScripts: argv.bundle === true,
      createZipArchive: argv.createzip === true,
      createMcadddonArchive: argv.createmcaddon === true,
    });
  },
});

yargs.parse();
