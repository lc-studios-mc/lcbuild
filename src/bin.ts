#!/usr/bin/env node

import * as fs from "fs-extra";
import * as path from "node:path";
import * as os from "node:os";
import * as child_process from "node:child_process";
import yargs from "yargs";
import isValidPath from "is-valid-path";
import ignore from "ignore";
import * as esbuild from "esbuild";
import { v4 as uuidv4 } from "uuid";

namespace Colors {
  export const Reset = "\x1b[0m";
  export const Bright = "\x1b[1m";
  export const Dim = "\x1b[2m";
  export const Underscore = "\x1b[4m";
  export const Blink = "\x1b[5m";
  export const Reverse = "\x1b[7m";
  export const Hidden = "\x1b[8m";

  export const FgBlack = "\x1b[30m";
  export const FgRed = "\x1b[31m";
  export const FgGreen = "\x1b[32m";
  export const FgYellow = "\x1b[33m";
  export const FgBlue = "\x1b[34m";
  export const FgMagenta = "\x1b[35m";
  export const FgCyan = "\x1b[36m";
  export const FgWhite = "\x1b[37m";
  export const FgGray = "\x1b[90m";

  export const BgBlack = "\x1b[40m";
  export const BgRed = "\x1b[41m";
  export const BgGreen = "\x1b[42m";
  export const BgYellow = "\x1b[43m";
  export const BgBlue = "\x1b[44m";
  export const BgMagenta = "\x1b[45m";
  export const BgCyan = "\x1b[46m";
  export const BgWhite = "\x1b[47m";
  export const BgGray = "\x1b[100m";
}

namespace DefaultManifestTemplates {
  export const BP = `{
  "format_version": 2,
  "header": {
    "description": "Pack description",
    "name": "Pack name §eBP §6<<<VERSION_HUMAN>>>§r",
    "uuid": "<<<UUID_HEADER>>>",
    "version": [<<<VERSION_SYSTEM>>>],
    "min_engine_version": [1, 21, 0]
  },
  "modules": [
    {
      "description": "Behavior pack",
      "type": "data",
      "uuid": "<<<UUID_MODULE>>>",
      "version": [<<<VERSION_SYSTEM>>>]
    },
    {
      "description": "Scripts",
      "language": "javascript",
      "type": "script",
      "uuid": "<<<UUID_SCRIPT>>>",
      "version": [<<<VERSION_SYSTEM>>>],
      "entry": "scripts/main.js"
    }
  ],
  "dependencies": [
    {
      // Resource pack
      "uuid": "<<<UUID_RP_HEADER>>>",
      "version": [<<<VERSION_SYSTEM>>>]
    },
    {
      "module_name": "@minecraft/server",
      "version": "1.11.0"
    },
    {
      "module_name": "@minecraft/server-ui",
      "version": "1.1.0"
    }
  ]
}
`;

  export const RP = `{
  "format_version": 2,
  "header": {
    "description": "Pack description",
    "name": "Pack name §eRP §6<<<VERSION_HUMAN>>>§r",
    "uuid": "<<<UUID_HEADER>>>",
    "version": [<<<VERSION_SYSTEM>>>],
    "min_engine_version": [1, 21, 0]
  },
  "modules": [
    {
      "description": "Resource pack",
      "type": "resources",
      "uuid": "<<<UUID_MODULE>>>",
      "version": [<<<VERSION_SYSTEM>>>]
    }
  ]
}
`;
}

class MessageError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export type BuildOptions = {
  bundleScripts?: boolean;
  minifyBundle?: boolean;
  copyToMc?: boolean;
  externalModules?: string[];
  compilationIgnorePatterns?: string[];
  comMojangDirPath: string | null;
  srcBpDirPath: string | null;
  srcRpDirPath: string | null;
  srcScriptsDirPath: string | null;
  bpManifestTemplateFilePath?: string;
  rpManifestTemplateFilePath?: string;
  entryScriptName?: string;
  packVersionSystem?: number[];
  packVersionHuman?: string;
  outputDirPath: string | null;
};

const TEMP_DIR_PATH = path.join(os.tmpdir(), "lcbuild");

const DEFAULT_BUILD_OPTIONS: BuildOptions = {
  bundleScripts: true,
  externalModules: ["@minecraft"],
  compilationIgnorePatterns: [
    "**/.git",
    "**/.gitignore",
    "**/.gitkeep",
    "**/node_modules",
    "**/*.bbmodel",
    "**/*.psd",
    "**/*.gif",
  ],
  comMojangDirPath: path.join(
    os.homedir(),
    "AppData\\Local\\Packages\\Microsoft.MinecraftUWP_8wekyb3d8bbwe\\LocalState\\games\\com.mojang",
  ),
  srcBpDirPath: null,
  srcRpDirPath: null,
  srcScriptsDirPath: null,
  entryScriptName: "main",
  outputDirPath: null,
} as const;

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

function runCommandSync(
  cmd: string,
  args: string[],
  options: child_process.SpawnOptionsWithoutStdio,
): string {
  const child = child_process.spawnSync(cmd, args, options);

  let data = "";
  data += child.stdout;
  data += child.stderr;

  return data;
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

function copyDirectorySync(srcDir: string, destDir: string, ignorePatterns: string[]): void {
  const ig = ignore().add(ignorePatterns);
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (ig.ignores(entry.name)) {
      continue;
    }

    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyDirectorySync(srcPath, destPath, ignorePatterns);
    } else if (entry.isFile()) {
      fs.copySync(srcPath, destPath, { overwrite: true });
    }
  }
}

function throwIfBuildOptionsObjectIsInvalid(buildOptions: BuildOptions): void {
  if (buildOptions.comMojangDirPath === (undefined || null))
    throw new MessageError("Build option 'comMojangDirPath' is undefined!");
  if (!isValidPath(path.resolve(buildOptions.comMojangDirPath)))
    throw new MessageError(`Path '${buildOptions.comMojangDirPath}' is invalid!`);

  if (buildOptions.srcBpDirPath === (undefined || null))
    throw new MessageError("Build option 'srcBpDirPath' is undefined!");
  if (!isValidPath(path.resolve(buildOptions.srcBpDirPath)))
    throw new MessageError(`Path '${buildOptions.srcBpDirPath}' is invalid!`);

  if (buildOptions.srcRpDirPath === (undefined || null))
    throw new MessageError("Build option 'srcRpDirPath' is undefined!");
  if (!isValidPath(path.resolve(buildOptions.srcRpDirPath)))
    throw new MessageError(`Path '${buildOptions.srcRpDirPath}' is invalid!`);

  if (buildOptions.outputDirPath === (undefined || null))
    throw new MessageError("Build option 'outputDirPath' is undefined!");
  if (!isValidPath(path.resolve(buildOptions.outputDirPath)))
    throw new MessageError(`Path '${buildOptions.outputDirPath}' is invalid!`);
}

function createBuildOptionsFromArgv(): BuildOptions {
  const commandOptions = yargs
    .options({
      bundleScripts: {
        description: "Bundle scripts into single file.",
        type: "boolean",
      },
      minifyBundle: {
        description: "Enable minify option when --bundleScripts is enabled.",
        type: "boolean",
      },
      copyToMc: {
        description:
          "Copy compiled packs to development_behavior_packs and development_resource_packs.",
        type: "boolean",
      },
      externalModules: {
        description: "Exclude packages/modules from bundling.",
        type: "array",
      },
      compilationIgnorePatterns: {
        description: "Glob patterns to ignore when compiling packs.",
        type: "array",
      },
      comMojangDirPath: {
        description:
          "Path to local Minecraft directory that contains development_behavior_packs and development_resource_packs.",
        type: "string",
      },
      srcBpDirPath: {
        description: "Path to behavior pack source directory.",
        type: "string",
      },
      srcRpDirPath: {
        description: "Path to resource pack source directory.",
        type: "string",
      },
      srcScriptsDirPath: {
        description: "Path to source directory containing behavior pack scripts.",
        type: "string",
      },
      bpManifestTemplateFilePath: {
        description: "Path to behavior pack manifest template file.",
        type: "string",
      },
      rpManifestTemplateFilePath: {
        description: "Path to resource pack manifest template file.",
        type: "string",
      },
      entryScriptName: {
        description: "Entry point script file name without extension.",
        type: "string",
      },
      packVersionSystem: {
        description: "Version array that Minecraft system can understand. [Major, Minor, Patch]",
        type: "array",
      },
      packVersionHuman: {
        description: "Human-readable version string. No strict format.",
        type: "string",
      },
      outputDirPath: {
        description: "Path to the directory that will contain compiled packs.",
        type: "string",
      },
    })
    .parseSync();

  let buildOptions: BuildOptions;

  buildOptions = Object.assign(structuredClone(DEFAULT_BUILD_OPTIONS), commandOptions);

  if ("$0" in buildOptions) {
    buildOptions.$0 = undefined;
  }

  if ("_" in buildOptions) {
    buildOptions._ = undefined;
  }

  return buildOptions;
}

export async function build(buildOptions?: BuildOptions): Promise<void> {
  buildOptions = buildOptions ? buildOptions : DEFAULT_BUILD_OPTIONS;

  const processUuid = uuidv4();
  const processTempDir = path.join(os.tmpdir(), "lcbuild", `_${processUuid}`);

  const tempBpDirPath = path.join(
    processTempDir,
    path.basename(path.resolve(buildOptions.srcBpDirPath!)),
  );
  const tempBpScriptsDirPath = path.join(tempBpDirPath, "scripts");
  const tempRpDirPath = path.join(
    processTempDir,
    path.basename(path.resolve(buildOptions.srcRpDirPath!)),
  );
  const tempScriptsDirPath = path.join(processTempDir, "scripts");

  try {
    throwIfBuildOptionsObjectIsInvalid(buildOptions);

    await fs.ensureDir(processTempDir);

    // ----- Copy src packs to temp

    await copyDirectory(
      path.resolve(buildOptions.srcBpDirPath!),
      tempBpDirPath,
      buildOptions.compilationIgnorePatterns ?? [],
    );

    await copyDirectory(
      path.resolve(buildOptions.srcRpDirPath!),
      tempRpDirPath,
      buildOptions.compilationIgnorePatterns ?? [],
    );

    // ----- Compile TypeScript

    console.log("Compiling scripts...");

    await runCommand("tsc", ["--noEmit false", `--outDir ${tempScriptsDirPath}`], {
      shell: true,
      cwd: process.cwd(),
    });

    if (buildOptions.bundleScripts === true) {
      console.log("Bundling compiled scripts...");

      await esbuild.build({
        entryPoints: [`${buildOptions.entryScriptName ?? "main"}.js`],
        bundle: true,
        minify: buildOptions.minifyBundle,
        external: buildOptions.externalModules,
        format: "esm",
        outfile: path.join(tempBpScriptsDirPath, `${buildOptions.entryScriptName ?? "main"}.js`),
      });
    } else {
      await fs.copy(tempScriptsDirPath, tempBpScriptsDirPath);
    }

    // ----- Generate manifests

    console.log("Generating manifests...");
  } catch (error) {
    if (error instanceof MessageError) {
      console.log(`${Colors.FgRed}${error}${Colors.Reset}`);
      return;
    }
    throw error;
  } finally {
    if (await fs.exists(processTempDir)) {
      await fs.rm(processTempDir, {
        recursive: true,
      });
    }
  }
}

export function buildSync(buildOptions?: BuildOptions): void {
  buildOptions = buildOptions ? buildOptions : DEFAULT_BUILD_OPTIONS;

  const processUuid = uuidv4();
  const processTempDir = path.join(os.tmpdir(), "lcbuild", `_${processUuid}`);

  try {
    throwIfBuildOptionsObjectIsInvalid(buildOptions);

    fs.ensureDirSync(processTempDir);
  } catch (error) {
    if (error instanceof MessageError) {
      console.log(`${Colors.FgRed}${error}${Colors.Reset}`);
      return;
    }
    throw error;
  } finally {
    if (fs.existsSync(processTempDir)) {
      fs.rmSync(processTempDir);
    }
  }
}

if (require.main === module) {
  const buildOptions = createBuildOptionsFromArgv();
  build(buildOptions);
}
