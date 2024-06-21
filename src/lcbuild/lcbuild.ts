import { MessageError } from "../common/errorTypes.js";
import { ReleaseVersion } from "../common/releaseVersion.js";
import * as projectPaths from "../common/projectPaths.js";
import { CONFIG_DATA } from "../common/config.js";
import { print, printError, printOkGreen, printWarn } from "../common/printFunctions.js";
import { createPackManifestsDev, createPackManifestsRelease } from "../common/packManifests.js";
import * as child_process from "node:child_process";
import * as path from "node:path";
import * as fs from "fs-extra";
import * as esbuild from "esbuild";
import ignore from "ignore";
import { replaceTscAliasPaths } from "tsc-alias";

export type BuildOptions = {
  bundleScripts: boolean;
  minifyBundle: boolean;
  copyToMc: boolean;
};

export type ReleaseBuildOptions = BuildOptions & {
  releaseVersion: ReleaseVersion;
};

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

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

async function copyDirectory(
  srcDir: string,
  destDir: string,
  ignorePatterns: string[],
): Promise<void> {
  const ig = ignore().add(ignorePatterns);
  const entries = await fs.readdir(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (ig.ignores(entry.name)) {
      continue;
    }

    if (entry.isDirectory()) {
      await fs.mkdir(destPath, { recursive: true });
      await copyDirectory(srcPath, destPath, ignorePatterns);
    } else if (entry.isFile()) {
      await fs.copy(srcPath, destPath, { overwrite: true });
    }
  }
}

async function removeTempDir(): Promise<void> {
  print("Removing temporary directory...");

  await fs.rm(projectPaths.TEMP_DIR, {
    recursive: true,
    force: true,
  });

  await delay(10);
}

async function copySrcToTemp(): Promise<void> {
  print(`Copying source files... Ignore patterns: ${CONFIG_DATA.compilationIgnorePatterns}`);

  await copyDirectory(
    projectPaths.SRC_BP_DIR,
    projectPaths.TEMP_BP_DIR,
    CONFIG_DATA.compilationIgnorePatterns,
  );

  await copyDirectory(
    projectPaths.SRC_RP_DIR,
    projectPaths.TEMP_RP_DIR,
    CONFIG_DATA.compilationIgnorePatterns,
  );
}

async function compileTypeScript(): Promise<void> {
  print("Compiling TypeScript files...");

  try {
    await runCommand("tsc", ["--noEmit false", `--outDir ${projectPaths.TEMP_SCRIPTS_DIR}`], {
      cwd: projectPaths.PROJ_DIR,
      shell: true,
    });

    await replaceTscAliasPaths({
      outDir: projectPaths.TEMP_SCRIPTS_DIR,
    });
  } catch (error) {
    throw new MessageError(`Failed to compile TypeScript files.
${error}`);
  }
}

async function bundleCompiledScripts(minify = false): Promise<void> {
  print("Bundling JavaScript files...");

  try {
    await esbuild.build({
      entryPoints: [
        path.join(projectPaths.TEMP_SCRIPTS_DIR, `${CONFIG_DATA.entryScriptFileName}.js`),
      ],
      bundle: true,
      format: "esm",
      external: CONFIG_DATA.externalModules,
      minify: minify,
      outfile: path.join(projectPaths.TEMP_BP_SCRIPTS_DIR, `${CONFIG_DATA.entryScriptFileName}.js`),
    });
  } catch (error) {
    throw new MessageError(`Failed to bundle scripts.
${error}`);
  }
}

async function generatePackManifestsInTempDev(): Promise<void> {
  print("Generating manifests...");

  const manifests = createPackManifestsDev();

  await fs.writeFile(path.join(projectPaths.TEMP_BP_DIR, "manifest.json"), manifests.bp, {
    encoding: "utf-8",
  });
  await fs.writeFile(path.join(projectPaths.TEMP_RP_DIR, "manifest.json"), manifests.rp, {
    encoding: "utf-8",
  });
}

async function generatePackManifestsInTempRelease(releaseVersion: ReleaseVersion): Promise<void> {
  print("Generating manifests...");

  const manifests = createPackManifestsRelease(releaseVersion);

  await fs.writeFile(path.join(projectPaths.TEMP_BP_DIR, "manifest.json"), manifests.bp, {
    encoding: "utf-8",
  });
  await fs.writeFile(path.join(projectPaths.TEMP_RP_DIR, "manifest.json"), manifests.rp, {
    encoding: "utf-8",
  });
}

async function copyTempPacksToOutputDev(): Promise<void> {
  print("Copying packs from temp to output...");

  await fs.rm(projectPaths.OUTPUT_DEV_BP_DIR, {
    recursive: true,
    force: true,
  });

  await copyDirectory(projectPaths.TEMP_BP_DIR, projectPaths.OUTPUT_DEV_BP_DIR, []);

  await fs.rm(projectPaths.OUTPUT_DEV_RP_DIR, {
    recursive: true,
    force: true,
  });

  await copyDirectory(projectPaths.TEMP_RP_DIR, projectPaths.OUTPUT_DEV_RP_DIR, []);
}

async function copyTempPacksToOutputRelease(releaseVersion: ReleaseVersion): Promise<void> {
  print("Copying packs from temp to output...");

  const dir = path.join(
    projectPaths.OUTPUT_RELEASE_DIR,
    `${CONFIG_DATA.shortAddonName}_${releaseVersion.toString()}`,
  );
  const bpDest = path.join(dir, CONFIG_DATA.behaviorPackDirectoryName);
  const rpDest = path.join(dir, CONFIG_DATA.resourcePackDirectoryName);

  await fs.rm(bpDest, {
    recursive: true,
    force: true,
  });

  await copyDirectory(projectPaths.TEMP_BP_DIR, bpDest, []);

  await fs.rm(rpDest, {
    recursive: true,
    force: true,
  });

  await copyDirectory(projectPaths.TEMP_BP_DIR, rpDest, []);
}

async function copyTempPacksToMinecraft(): Promise<void> {
  print("Copying packs to local Minecraft directory...");

  const bpDest = path.join(
    CONFIG_DATA.minecraftComMojangDirectoryPath,
    "development_behavior_packs",
    CONFIG_DATA.behaviorPackDirectoryName,
  );

  const rpDest = path.join(
    CONFIG_DATA.minecraftComMojangDirectoryPath,
    "development_resource_packs",
    CONFIG_DATA.resourcePackDirectoryName,
  );

  await fs.rm(bpDest, {
    recursive: true,
    force: true,
  });

  await copyDirectory(projectPaths.TEMP_BP_DIR, bpDest, []);

  await fs.rm(rpDest, {
    recursive: true,
    force: true,
  });

  await copyDirectory(projectPaths.TEMP_RP_DIR, rpDest, []);
}

export async function buildDev(buildOptions: BuildOptions): Promise<void> {
  printWarn("Build started... (DEV)");

  try {
    const timeStart = Date.now();

    await removeTempDir();
    await copySrcToTemp();
    await compileTypeScript();

    if (buildOptions.bundleScripts) {
      await bundleCompiledScripts(buildOptions.minifyBundle);
    } else {
      fs.cpSync(projectPaths.TEMP_SCRIPTS_DIR, projectPaths.TEMP_BP_SCRIPTS_DIR, {
        recursive: true,
        force: true,
      });
    }

    await generatePackManifestsInTempDev();
    await copyTempPacksToOutputDev();

    if (buildOptions.copyToMc) {
      await copyTempPacksToMinecraft();
    }

    const timeEnd = Date.now();

    printOkGreen(`Build finished!`);
    printOkGreen(`Done in ${timeEnd - timeStart}ms`);

    // Play sound to notify users about that the task is complete

    await runCommand(
      "powershell",
      ['-c (New-Object Media.SoundPlayer "C:\\Windows\\Media\\notify.wav").PlaySync();'],
      {
        shell: true,
      },
    );
  } catch (error) {
    if (error instanceof MessageError) {
      printError(`${error}`);
      return;
    }
    throw error;
  }
}

export async function buildRelease(buildOptions: ReleaseBuildOptions): Promise<void> {
  printWarn("Build started... (RELEASE)");

  try {
    const timeStart = Date.now();

    await removeTempDir();
    await copySrcToTemp();
    await compileTypeScript();

    if (buildOptions.bundleScripts) {
      await bundleCompiledScripts(buildOptions.minifyBundle);
    } else {
      fs.cpSync(projectPaths.TEMP_SCRIPTS_DIR, projectPaths.TEMP_BP_SCRIPTS_DIR, {
        recursive: true,
        force: true,
      });
    }

    await generatePackManifestsInTempRelease(buildOptions.releaseVersion);
    await copyTempPacksToOutputRelease(buildOptions.releaseVersion);

    if (buildOptions.copyToMc) {
      await copyTempPacksToMinecraft();
    }

    const timeEnd = Date.now();

    printOkGreen(`Build finished!`);
    printOkGreen(`Done in ${timeEnd - timeStart}ms`);
  } catch (error) {
    if (error instanceof MessageError) {
      printError(`${error}`);
      return;
    }
    throw error;
  }
}
