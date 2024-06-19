#!/usr/bin/env node

import "../common/projectPaths";
import {
  ReleaseStage,
  ReleaseVersion,
  VALID_RELEASE_STAGE_ARRAY,
} from "../common/releaseVersion.js";
import { buildDev, buildRelease } from "../lcbuild/lcbuild.js";
import * as yargs from "yargs";

yargs.command({
  command: "dev",
  describe: "Build packs in dev mode",
  builder: {
    bundleScripts: {
      description: "Choose whether to bundle scripts into a single file",
      type: "boolean",
      default: false,
    },
    minifyBundle: {
      description: "Choose whether to minify scripts when --bundleScripts is set to true",
      type: "boolean",
      default: false,
    },
    copyToMc: {
      description: "Choose whether to copy build to local Minecraft directory",
      type: "boolean",
      default: false,
    },
  },
  handler(argv) {
    buildDev({
      bundleScripts: argv.bundleScripts === true,
      minifyBundle: argv.minifyBundle === true,
      copyToMc: argv.copyToMc === true,
    });
  },
});

yargs.command({
  command: "release",
  describe: "Build packs in release mode",
  builder: {
    bundleScripts: {
      description: "Choose whether to bundle scripts into a single file",
      type: "boolean",
      default: false,
    },
    minifyBundle: {
      description: "Choose whether to minify scripts when --bundleScripts is set to true",
      type: "boolean",
      default: false,
    },
    copyToMc: {
      description: "Choose whether to copy build to local Minecraft directory",
      type: "boolean",
      default: false,
    },
    releaseVersion: {
      alias: "v",
      description: 'Specify the release build version in "1 2 3" format',
      type: "array",
      demandOption: true,
    },
    releaseStage: {
      alias: "s",
      description: "Specify the release stage",
      type: "string",
      demandOption: true,
      choices: VALID_RELEASE_STAGE_ARRAY,
    },
    releaseIteration: {
      alias: "i",
      description: "Specify the iteration index of the release",
      type: "number",
      default: 1,
    },
  },
  handler(argv) {
    buildRelease({
      bundleScripts: argv.bundleScripts === true,
      minifyBundle: argv.minifyBundle === true,
      copyToMc: argv.copyToMc === true,
      releaseVersion: new ReleaseVersion(
        [
          +(argv.releaseVersion[0] ?? "1"),
          +(argv.releaseVersion[1] ?? "0"),
          +(argv.releaseVersion[2] ?? "0"),
        ],
        argv.releaseStage as ReleaseStage,
        argv.releaseIteration,
      ),
    });
  },
});

yargs.parseSync();
