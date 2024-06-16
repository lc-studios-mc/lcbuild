import { CONFIG_DATA } from "./config";
import { ReleaseVersion } from "./releaseVersion";
import { v4 as uuidv4 } from "uuid";

export namespace PackManifest {
  export namespace Template {
    export const BP = `{
  "format_version": 2,
  "header": {
    "description": "<<<PACK_DESCRIPTION>>>",
    "name": "<<<ADDON_NAME>>> §eBP §6<<<VERSION_HUMAN>>>§r",
    "uuid": "<<<UUID_HEADER>>>",
    "version": [<<<VERSION_SYSTEM>>>],
    "min_engine_version": [<<<MIN_ENGINE_VERSION>>>]
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
      "uuid": "<<<UUID_SCRIPT_MODULE>>>",
      "version": [<<<VERSION_SYSTEM>>>],
      "entry": "scripts/index.js"
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
      "version": "<<<SERVER_API_VERSION>>>", CONFIG_DATA.serverApiVersion
    },
    {
      "module_name": "@minecraft/server-ui",
      "version": "<<<SERVER_UI_API_VERSION>>>"
    }
  ]
}
`;

    export const RP = `{
  "format_version": 2,
  "header": {
    "description": "<<<PACK_DESCRIPTION>>>",
    "name": "<<<ADDON_NAME>>> §bRP §6<<<VERSION_HUMAN>>>§r",
    "uuid": "<<<UUID_HEADER>>>",
    "version": [<<<VERSION_SYSTEM>>>],
    "min_engine_version": [<<<MIN_ENGINE_VERSION>>>]
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

  export type ReturnObject = {
    bp: string;
    rp: string;
  };

  export function createForDevBuild(): ReturnObject {
    const bpManifest = Template.BP.replace("<<<ADDON_NAME>>>", CONFIG_DATA.fullAddonName)
      .replace("<<<PACK_DESCRIPTION>>>", CONFIG_DATA.behaviorPackHeaderDescription)
      .replace("<<<VERSION_HUMAN>>>", "DEV")
      .replace("<<<VERSION_SYSTEM>>>", "1,0,0")
      .replace("<<<MIN_ENGINE_VERSION>>>", CONFIG_DATA.minEngineVersion.toString())
      .replace("<<<UUID_HEADER>>>", CONFIG_DATA.devBuildBehaviorPackHeaderUuid)
      .replace("<<<UUID_RP_HEADER>>>", CONFIG_DATA.devBuildResourcePackHeaderUuid)
      .replace("<<<UUID_MODULE>>>", CONFIG_DATA.devBuildBehaviorPackModuleUuid.toString())
      .replace(
        "<<<UUID_SCRIPT_MODULE>>>",
        CONFIG_DATA.devBuildBehaviorPackScriptModuleUuid.toString(),
      )
      .replace("<<<SERVER_API_VERSION>>>", CONFIG_DATA.serverApiVersion)
      .replace("<<<SERVER_UI_API_VERSION>>>", CONFIG_DATA.serverUiApiVersion);

    const rpManifest = Template.RP.replace("<<<ADDON_NAME>>>", CONFIG_DATA.fullAddonName)
      .replace("<<<PACK_DESCRIPTION>>>", CONFIG_DATA.resourcePackHeaderDescription)
      .replace("<<<VERSION_HUMAN>>>", "DEV")
      .replace("<<<VERSION_SYSTEM>>>", "1,0,0")
      .replace("<<<MIN_ENGINE_VERSION>>>", CONFIG_DATA.minEngineVersion.toString())
      .replace("<<<UUID_HEADER>>>", CONFIG_DATA.devBuildResourcePackHeaderUuid)
      .replace("<<<UUID_MODULE>>>", CONFIG_DATA.devBuildResourcePackModuleUuid.toString());

    return {
      bp: bpManifest,
      rp: rpManifest,
    };
  }

  export function createForReleaseBuild(releaseVersion: ReleaseVersion): ReturnObject {
    const uuidBpHeader = uuidv4();
    const uuidBpModule = uuidv4();
    const uuidBpScript = uuidv4();
    const uuidRpHeader = uuidv4();
    const uuidRpModule = uuidv4();

    const bpManifest = Template.BP.replace("<<<ADDON_NAME>>>", CONFIG_DATA.fullAddonName)
      .replace("<<<PACK_DESCRIPTION>>>", CONFIG_DATA.behaviorPackHeaderDescription)
      .replace("<<<VERSION_HUMAN>>>", releaseVersion.toString())
      .replace("<<<VERSION_SYSTEM>>>", releaseVersion.toArray().toString())
      .replace("<<<MIN_ENGINE_VERSION>>>", CONFIG_DATA.minEngineVersion.toString())
      .replace("<<<UUID_HEADER>>>", uuidBpHeader)
      .replace("<<<UUID_MODULE>>>", uuidBpModule)
      .replace("<<<UUID_SCRIPT_MODULE>>>", uuidBpScript)
      .replace("<<<UUID_RP_HEADER>>>", uuidRpHeader)
      .replace("<<<SERVER_API_VERSION>>>", CONFIG_DATA.serverApiVersion)
      .replace("<<<SERVER_UI_API_VERSION>>>", CONFIG_DATA.serverUiApiVersion);

    const rpManifest = Template.RP.replace("<<<ADDON_NAME>>>", CONFIG_DATA.fullAddonName)
      .replace("<<<PACK_DESCRIPTION>>>", CONFIG_DATA.resourcePackHeaderDescription)
      .replace("<<<VERSION_HUMAN>>>", releaseVersion.toString())
      .replace("<<<VERSION_SYSTEM>>>", releaseVersion.toArray().toString())
      .replace("<<<MIN_ENGINE_VERSION>>>", CONFIG_DATA.minEngineVersion.toString())
      .replace("<<<UUID_HEADER>>>", uuidRpHeader)
      .replace("<<<UUID_MODULE>>>", uuidRpModule);

    return {
      bp: bpManifest,
      rp: rpManifest,
    };
  }
}
