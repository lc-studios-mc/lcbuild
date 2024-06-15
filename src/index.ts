#!/usr/bin/env node

import { print, printError, printOkCyan, printOkGreen, printWarn } from "./printFunctions";
import {
  ReleaseStage,
  ReleaseVersion,
  VALID_RELEASE_STAGES,
  isStringValidReleaseStage,
} from "./releaseVersion";
import yargs from "yargs";

function dev(copyPacksToMc: boolean): void {
  printWarn("Build started... (Dev)");

  printOkGreen("Build finished!");
}

function release(releaseVersion: ReleaseVersion, copyPacksToMc: boolean): void {
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
  },
  handler(argv) {
    dev(argv.copytomc === true);
  },
});

yargs.command({
  command: "release",
  describe: "Compiles the addon in release mode",
  builder: {
    ver: {
      describe: "Version as number array [Major, Minor, Patch]",
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

    release(releaseVersion, argv.copytomc === true);
  },
});

yargs.parse();
