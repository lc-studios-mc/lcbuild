#!/usr/bin/env node

import * as fs from "fs-extra";
import * as path from "node:path";
import * as os from "node:os";
import * as child_process from "node:child_process";
import yargs from "yargs";
import isValidPath from "is-valid-path";
import ignore from "ignore";
import * as tscAlias from "tsc-alias";
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
  /**
   * Bundle behavior pack scripts into single file
   */
  bundleScripts?: boolean;
  /**
   * Minify script bundle when `bundleScripts` is enabled
   */
  minifyBundle?: boolean;
  /**
   * Copy compiled packs to development_behavior_packs and development_resource_packs after build process is finished
   */
  copyToMc?: boolean;
  /**
   * Tells bundler to ignore packages/modules in this list
   */
  externalModules?: string[];
  /**
   * Glob patterns to ignroe from pack compilation
   */
  compilationIgnorePatterns?: string[];
  /**
   * Absolute path to com.mojang directory used by Minecraft
   *
   * It is commonly located at
   *
   * C:\Users\ `USERNAME` \AppData\Local\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState\games\com.mojang
   */
  comMojangDirPath: string | null;
  /**
   * Path to behavior pack source directory
   */
  srcBpDirPath: string | null;
  /**
   * Path to resource pack source directory
   */
  srcRpDirPath: string | null;
  /**
   * Path to behavior pack manifest template file
   */
  bpManifestTemplateFilePath?: string;
  /**
   * Path to resource pack manifest template file
   */
  rpManifestTemplateFilePath?: string;
  /**
   * Name of the entry script file name without extension
   */
  entryScriptName?: string;
  /**
   * Specify oack version in number array
   */
  packVersionSystem?: number[];
  /**
   * Specify oack version in string for humans
   */
  packVersionHuman?: string;
  /**
   * Path to the directory that will contain build output
   */
  outputDirPath: string | null;
  /**
   * Delete existing directories and files at output destination
   */
  deletePreviousOutput?: boolean;
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
  entryScriptName: "main",
  packVersionSystem: [1, 0, 0],
  packVersionHuman: "1.0.0",
  outputDirPath: null,
} as const;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function createManifestsFromTemplates(
  bpTemplate: string,
  rpTemplate: string,
  buildOptions: BuildOptions,
): { bp: string; rp: string } {
  const uuidBpHeader = uuidv4();
  const uuidBpModule = uuidv4();
  const uuidBpScript = uuidv4();
  const uuidRpHeader = uuidv4();
  const uuidRpModule = uuidv4();

  const packVerSystem = buildOptions.packVersionSystem?.toString() ?? "1,0,0";
  const packVerHuman = buildOptions.packVersionHuman?.toString() ?? "1.0.0";

  const manifestBp = bpTemplate
    .replaceAll("<<<UUID_HEADER>>>", uuidBpHeader)
    .replaceAll("<<<UUID_MODULE>>>", uuidBpModule)
    .replaceAll("<<<UUID_SCRIPT>>>", uuidBpScript)
    .replaceAll("<<<UUID_RP_HEADER>>>", uuidRpHeader)
    .replaceAll("<<<VERSION_SYSTEM>>>", packVerSystem)
    .replaceAll("<<<VERSION_HUMAN>>>", packVerHuman);

  const manifestRp = rpTemplate
    .replaceAll("<<<UUID_HEADER>>>", uuidRpHeader)
    .replaceAll("<<<UUID_MODULE>>>", uuidRpModule)
    .replaceAll("<<<VERSION_SYSTEM>>>", packVerSystem)
    .replaceAll("<<<VERSION_HUMAN>>>", packVerHuman);

  return {
    bp: manifestBp,
    rp: manifestRp,
  };
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
      deletePreviousOutput: {
        description: "Delete existing directories at output destination",
        type: "boolean",
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

  function resolvePathProp(propName: keyof typeof buildOptions): void {
    const val = buildOptions[propName];
    if (typeof val !== "string") return;
    (buildOptions[propName] as string) = path.resolve(val);
  }

  resolvePathProp("srcBpDirPath");
  resolvePathProp("srcRpDirPath");
  resolvePathProp("bpManifestTemplateFilePath");
  resolvePathProp("rpManifestTemplateFilePath");
  resolvePathProp("outputDirPath");

  return buildOptions;
}

export async function build(buildOptions?: BuildOptions): Promise<void> {
  buildOptions = buildOptions
    ? Object.assign(structuredClone(DEFAULT_BUILD_OPTIONS), buildOptions)
    : DEFAULT_BUILD_OPTIONS;

  const startTime = Date.now();

  const processUuid = uuidv4();
  const processTempDir = path.join(os.tmpdir(), "lcbuild", `_${processUuid}`);

  try {
    throwIfBuildOptionsObjectIsInvalid(buildOptions);

    const bpName = path.basename(path.resolve(buildOptions.srcBpDirPath!));
    const rpName = path.basename(path.resolve(buildOptions.srcRpDirPath!));

    const tempBpDirPath = path.join(processTempDir, bpName);
    const tempBpScriptsDirPath = path.join(tempBpDirPath, "scripts");
    const tempRpDirPath = path.join(processTempDir, rpName);
    const tempScriptsDirPath = path.join(processTempDir, "scripts");

    const outputBpDirPath = path.join(buildOptions.outputDirPath!, bpName);
    const outputRpDirPath = path.join(buildOptions.outputDirPath!, rpName);

    const mcBpDir = path.join(buildOptions.comMojangDirPath!, "development_behavior_packs", bpName);
    const mcRpDir = path.join(buildOptions.comMojangDirPath!, "development_resource_packs", rpName);

    console.log(`${Colors.FgYellow}Build started...${Colors.Reset}`);

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

    await tscAlias.replaceTscAliasPaths({
      outDir: tempScriptsDirPath,
    });

    if (buildOptions.bundleScripts === true) {
      console.log("Bundling compiled scripts...");

      const mainFileName = `${buildOptions.entryScriptName ?? "main"}`;

      await esbuild.build({
        entryPoints: [path.join(tempScriptsDirPath, `${mainFileName}.js`)],
        bundle: true,
        minify: buildOptions.minifyBundle,
        external: buildOptions.externalModules,
        format: "esm",
        outfile: path.join(tempBpScriptsDirPath, `${mainFileName}.js`),
      });
    } else {
      await fs.copy(tempScriptsDirPath, tempBpScriptsDirPath);
    }

    // ----- Generate manifests

    console.log("Generating manifests...");

    const bpManifestTemplate: string = await (async function (): Promise<string> {
      if (buildOptions.bpManifestTemplateFilePath === undefined) {
        console.log(
          `${Colors.FgYellow}Behavior pack manifest template file was undefined. Using default template instead.${Colors.Reset}`,
        );
        return DefaultManifestTemplates.BP;
      }

      if (!(await fs.exists(buildOptions.bpManifestTemplateFilePath))) {
        console.log(
          `${Colors.FgYellow}Behavior pack manifest template file was not found at ${buildOptions.bpManifestTemplateFilePath}
Using default template instead.${Colors.Reset}`,
        );
        return DefaultManifestTemplates.BP;
      }

      const text = (
        await fs.readFile(buildOptions.bpManifestTemplateFilePath, { encoding: "utf-8" })
      ).toString();

      return text;
    })();

    const rpManifestTemplate: string = await (async function (): Promise<string> {
      if (buildOptions.rpManifestTemplateFilePath === undefined) {
        console.log(
          `${Colors.FgYellow}Resource pack manifest template file was undefined. Using default template instead.${Colors.Reset}`,
        );
        return DefaultManifestTemplates.RP;
      }

      if (!(await fs.exists(buildOptions.rpManifestTemplateFilePath))) {
        console.log(
          `${Colors.FgYellow}Resource pack manifest template file was not found at ${buildOptions.rpManifestTemplateFilePath}
Using default template instead.${Colors.Reset}`,
        );
        return DefaultManifestTemplates.RP;
      }

      const text = (
        await fs.readFile(buildOptions.rpManifestTemplateFilePath, { encoding: "utf-8" })
      ).toString();

      return text;
    })();

    const manifests = createManifestsFromTemplates(
      bpManifestTemplate,
      rpManifestTemplate,
      buildOptions,
    );

    const bpManifestPath = path.join(tempBpDirPath, "manifest.json");
    const rpManifestPath = path.join(tempRpDirPath, "manifest.json");

    await fs.writeFile(bpManifestPath, manifests.bp, { encoding: "utf-8" });
    await fs.writeFile(rpManifestPath, manifests.rp, { encoding: "utf-8" });

    // ----- Copy to output directory

    console.log("Copying packs to output destination...");

    if (buildOptions.deletePreviousOutput === true) {
      await fs.rm(outputBpDirPath, { force: true, recursive: true });
      await fs.rm(outputRpDirPath, { force: true, recursive: true });
      await delay(80);
    }

    await fs.copy(tempBpDirPath, outputBpDirPath, { overwrite: true });
    await fs.copy(tempRpDirPath, outputRpDirPath, { overwrite: true });

    if (buildOptions.copyToMc === true) {
      console.log("Copying packs to Minecraft...");

      if (buildOptions.deletePreviousOutput === true) {
        await fs.rm(mcBpDir, { force: true, recursive: true });
        await fs.rm(mcRpDir, { force: true, recursive: true });
        await delay(80);
      }

      await fs.copy(tempBpDirPath, mcBpDir, { overwrite: true });
      await fs.copy(tempRpDirPath, mcRpDir, { overwrite: true });
    }

    console.log(`${Colors.FgGreen}Build finished!${Colors.Reset}`);

    await runCommand(
      "powershell",
      [
        "-c (New-Object Media.SoundPlayer 'C:\\Windows\\Media\\Windows Background.wav').PlaySync();",
      ],
      {
        shell: true,
      },
    );
  } catch (error) {
    await runCommand(
      "powershell",
      [
        "-c (New-Object Media.SoundPlayer 'C:\\Windows\\Media\\Windows Foreground.wav').PlaySync();",
      ],
      {
        shell: true,
      },
    );

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

    const endTime = Date.now();

    console.log(`Process finished in ${endTime - startTime}ms`);
  }
}

if (require.main === module) {
  const buildOptions = createBuildOptionsFromArgv();
  build(buildOptions);
}
