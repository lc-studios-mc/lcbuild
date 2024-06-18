import { MessageError } from "../common/errorTypes";
import { ReleaseVersion } from "../common/releaseVersion";
import * as projectPaths from "../common/projectPaths";
import { CONFIG_DATA } from "../common/config";
import * as child_process from "node:child_process";
import * as path from "node:path";
import * as fs from "fs-extra";
import * as esbuild from "esbuild";
import soundplayer from "play-sound";
import { LOGGER } from "../logger";
import { print, printError, printOkGreen, printWarn } from "../common/printFunctions";

export type BuildOptions = {
  bundleScripts: boolean;
  copyToMc: boolean;
};

export type ReleaseBuildOptions = BuildOptions & {
  releaseVersion: ReleaseVersion;
};

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

async function compileTypeScript(): Promise<void> {
  print("Transpiling TypeScript files...");

  try {
    await runCommand("tsc", ["--noEmit false", `--outDir ${projectPaths.TEMP_SCRIPTS_DIR}`], {
      cwd: projectPaths.PROJ_DIR,
      shell: true,
    });
  } catch (error) {
    throw new MessageError(`Failed to compile TypeScript files.
${error}`);
  }
}

async function bundleCompiledScripts(): Promise<void> {
  print("Bundling JavaScript files...");

  try {
    await esbuild.build({
      entryPoints: [
        path.join(projectPaths.TEMP_SCRIPTS_DIR, `${CONFIG_DATA.entryScriptFileName}.js`),
      ],
      bundle: true,
      format: "esm",
      external: CONFIG_DATA.externalModules,
      minify: CONFIG_DATA.minifyBundle,
      outfile: path.join(projectPaths.TEMP_BP_SCRIPTS_DIR, `${CONFIG_DATA.entryScriptFileName}.js`),
    });
  } catch (error) {
    throw new MessageError(`Failed to bundle scripts.
${error}`);
  }
}

export async function startBuildDev(buildOptions: BuildOptions): Promise<void> {
  printWarn("Build started... (DEV)");

  try {
    await compileTypeScript();

    if (buildOptions.bundleScripts) {
      await bundleCompiledScripts();
    } else {
      fs.cpSync(projectPaths.TEMP_SCRIPTS_DIR, projectPaths.TEMP_BP_SCRIPTS_DIR, {
        recursive: true,
        force: true,
      });
    }
  } catch (error) {
    if (error instanceof MessageError) {
      printError(`${error}`);
      return;
    }
  }

  soundplayer().play("C:\\Windows\\Media\\Windows Background.wav");

  printOkGreen("Build finished!");
}

export async function startBuildRelease(buildOptions: ReleaseBuildOptions): Promise<void> {}
