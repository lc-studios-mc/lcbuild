# LCBuild

LCBuild is a Minecraft addon compiler that you can use through commands.

A quick overview of what you can achieve with LCBuild:

- TypeScript support
- Centralized project directory
- One command to compile and copy your packs to Minecraft
- Automatic manifest.json UUID generation for release builds

## Prerequisites

LCBuild **only works on Windows 10/11** and requires [Node.js]((http://nodejs.org/)) version 14 or later. 

Make sure TypeScript is installed globally via npm:

```sh
npm i typescript -g
```

## Table of contents

- [LCBuild](#lcbuild)
  - [Prerequisites](#prerequisites)
  - [Table of contents](#table-of-contents)
  - [Installation](#installation)
  - [Command](#command)
  - [Execute from script](#execute-from-script)
  - [Manifest templates](#manifest-templates)
  - [Contributing](#contributing)
  - [License](#license)

## Installation

**BEFORE YOU INSTALL:** please read the [prerequisites](#prerequisites)

***First***, create a folder somewhere on your drive (C:\ or not does not matter) and open it in terminal.

***Second***, run the command:

```sh
npm init -y
npm i lcbuild typescript --save-dev
npm i @minecraft/server@latest @minecraft/server-ui@latest --save-exact
tsc --init
```

Installation is complete!

## Command

Run ``npx lcbuild --help`` to see list of arguments.

However, if you prefer JavaScript, you can also [execute build command from script](#execute-from-script).

## Execute from script

Create ``build.mjs`` inside your project:

```javascript
// build.mjs

import * as lcbuild from "lcbuild";

await lcbuild.build({
  srcBpDirPath: /* Path to behavior pack directory */,
  srcRpDirPath: /* Path to resource pack directory */,
  outputDirPath: /* Path to output directory */,
  packVersionSystem: [1, 0, 0],
  packVersionHuman: "1.0.0",
  deletePreviousOutput: true
})
```

To execute build:

```sh
node build.mjs
```

## Manifest templates

Some texts sorrounded by `<<<>>>` will be converted by LCBuild.

<details>
  <summary>Behavior pack manifest template</summary>
  
  ```json
  {
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
  ```
  
</details>

<details>
  <summary>Resource pack manifest template</summary>
  
  ```json
  {
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
  ```
  
</details>

## Contributing

LCBuild is an open-source project.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for more details.

## License

Licensed under [MIT](./LICENSE)
