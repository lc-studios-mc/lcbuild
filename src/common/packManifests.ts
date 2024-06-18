import * as path from "node:path";
import * as fs from "fs-extra";
import * as projectPaths from "./projectPaths";
import { v4 as uuidv4 } from "uuid";
import { printOkCyan } from "./printFunctions";
import { ReleaseVersion } from "./releaseVersion";

type ManifestCreationReturnObject = {
  bp: string;
  rp: string;
};

namespace DefaultTemplates {
  export const BP = `{
  "format_version": 2,
  "header": {
    "description": "Pack description",
    "name": "Untitled Addon §eBP §6<<<VERSION_HUMAN>>>§r",
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
    "name": "Untitled Addon §eRP §6<<<VERSION_HUMAN>>>§r",
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

const MANIFEST_TEMPLATE_BP_DEV_FILE = path.join(projectPaths.MANIFEST_TEMPLATES_DIR, "dev-bp.json");
const MANIFEST_TEMPLATE_RP_DEV_FILE = path.join(projectPaths.MANIFEST_TEMPLATES_DIR, "dev-rp.json");
const MANIFEST_TEMPLATE_BP_RELEASE_FILE = path.join(
  projectPaths.MANIFEST_TEMPLATES_DIR,
  "release-bp.json",
);
const MANIFEST_TEMPLATE_RP_RELEASE_FILE = path.join(
  projectPaths.MANIFEST_TEMPLATES_DIR,
  "release-bp.json",
);

function ensureFiles(): void {
  const manifestTemplateBpDevExists = fs.existsSync(MANIFEST_TEMPLATE_BP_DEV_FILE);
  const manifestTemplateRpDevExists = fs.existsSync(MANIFEST_TEMPLATE_RP_DEV_FILE);
  const manifestTemplateBpReleaseExists = fs.existsSync(MANIFEST_TEMPLATE_BP_RELEASE_FILE);
  const manifestTemplateRpReleaseExists = fs.existsSync(MANIFEST_TEMPLATE_RP_RELEASE_FILE);

  if (!manifestTemplateBpDevExists || !manifestTemplateRpDevExists) {
    const uuidBpHeader = uuidv4();
    const uuidBpModule = uuidv4();
    const uuidBpScript = uuidv4();
    const uuidRpHeader = uuidv4();
    const uuidRpModule = uuidv4();

    const manifestBp = DefaultTemplates.BP.replace("<<<UUID_HEADER>>>", uuidBpHeader)
      .replace("<<<UUID_MODULE>>>", uuidBpModule)
      .replace("<<<UUID_SCRIPT>>>", uuidBpScript)
      .replace("<<<UUID_RP_HEADER>>>", uuidRpHeader)
      .replace("<<<VERSION_SYSTEM>>>", "1,0,0")
      .replace("<<<VERSION_HUMAN>>>", "DEV");

    const manifestRp = DefaultTemplates.RP.replace("<<<UUID_HEADER>>>", uuidRpHeader)
      .replace("<<<UUID_MODULE>>>", uuidRpModule)
      .replace("<<<VERSION_SYSTEM>>>", "1,0,0")
      .replace("<<<VERSION_HUMAN>>>", "DEV");

    if (!manifestTemplateBpDevExists) {
      fs.writeFileSync(MANIFEST_TEMPLATE_BP_DEV_FILE, manifestBp, { encoding: "utf-8" });
      printOkCyan(`Saved DEV behavior pack manifest template at ${MANIFEST_TEMPLATE_BP_DEV_FILE}`);
    }

    if (!manifestTemplateRpDevExists) {
      fs.writeFileSync(MANIFEST_TEMPLATE_RP_DEV_FILE, manifestRp, { encoding: "utf-8" });
      printOkCyan(`Saved DEV resource pack manifest template at ${MANIFEST_TEMPLATE_RP_DEV_FILE}`);
    }
  }

  if (!manifestTemplateBpReleaseExists) {
    fs.writeFileSync(MANIFEST_TEMPLATE_BP_RELEASE_FILE, DefaultTemplates.BP, { encoding: "utf-8" });
    printOkCyan(
      `Saved RELEASE behavior pack manifest template at ${MANIFEST_TEMPLATE_BP_RELEASE_FILE}`,
    );
  }

  if (!manifestTemplateRpReleaseExists) {
    fs.writeFileSync(MANIFEST_TEMPLATE_RP_RELEASE_FILE, DefaultTemplates.RP, { encoding: "utf-8" });
    printOkCyan(
      `Saved RELEASE resource pack manifest template at ${MANIFEST_TEMPLATE_RP_RELEASE_FILE}`,
    );
  }
}

export function createPackManifestsDev(): ManifestCreationReturnObject {
  ensureFiles();

  const manifestBp = fs.readFileSync(MANIFEST_TEMPLATE_BP_DEV_FILE, { encoding: "utf-8" });
  const manifestRp = fs.readFileSync(MANIFEST_TEMPLATE_RP_DEV_FILE, { encoding: "utf-8" });

  return {
    bp: manifestBp,
    rp: manifestRp,
  };
}

export function createPackManifestsRelease(
  releaseVersion: ReleaseVersion,
): ManifestCreationReturnObject {
  ensureFiles();

  const uuidBpHeader = uuidv4();
  const uuidBpModule = uuidv4();
  const uuidBpScript = uuidv4();
  const uuidRpHeader = uuidv4();
  const uuidRpModule = uuidv4();

  const manifestBp = fs
    .readFileSync(MANIFEST_TEMPLATE_BP_RELEASE_FILE, { encoding: "utf-8" })
    .replace("<<<UUID_HEADER>>>", uuidBpHeader)
    .replace("<<<UUID_MODULE>>>", uuidBpModule)
    .replace("<<<UUID_SCRIPT>>>", uuidBpScript)
    .replace("<<<UUID_RP_HEADER>>>", uuidRpHeader)
    .replace("<<<VERSION_SYSTEM>>>", releaseVersion.toArray().toString())
    .replace("<<<VERSION_HUMAN>>>", releaseVersion.toString());

  const manifestRp = fs
    .readFileSync(MANIFEST_TEMPLATE_RP_RELEASE_FILE, { encoding: "utf-8" })
    .replace("<<<UUID_HEADER>>>", uuidRpHeader)
    .replace("<<<UUID_MODULE>>>", uuidRpModule)
    .replace("<<<VERSION_SYSTEM>>>", releaseVersion.toArray().toString())
    .replace("<<<VERSION_HUMAN>>>", releaseVersion.toString());

  return {
    bp: manifestBp,
    rp: manifestRp,
  };
}

ensureFiles();
