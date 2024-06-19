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
  - [Why use LCBuild](#why-use-lcbuild)
  - [Installation](#installation)
    - [Config properties](#config-properties)
  - [Commands](#commands)
    - [Create development build](#create-development-build)
      - [Arguments](#arguments)
    - [Create release build](#create-release-build)
      - [Arguments](#arguments-1)
  - [History of LCBuild](#history-of-lcbuild)
  - [Contributing](#contributing)
  - [License](#license)

## Why use LCBuild

If you are making a Minecraft addon, you will probably feel (or already felt) that putting your projects directly inside development_behavior_pack and development_resource_pack is not really good.

And if you want to use TypeScript in a behavior pack inside development_behavior_pack, you will not have a good time.

With LCBuild, you can say goodbye to those nightmares!

## Installation

**BEFORE YOU INSTALL:** please read the [prerequisites](#prerequisites)

***First***, create a folder somewhere on your drive (C:\ or not does not matter) and open it in terminal.

***Second***, run the command:

```sh
npm init -y
npm i @luckedcoronet/lcbuild typescript --save-dev
npm i @minecraft/server@latest @minecraft/server-ui@latest --save-exact
tsc --init
```

***Third***, run the command:

```sh
npx lcbuild
```

This will generate a folder named ".lcbuild" in your project folder, which contains files used by LCBuild.

***Fourth***, open **config.json** inside .lcbuild and change properties to your preferences. See [Config properties](#config-properties) for details.

***Fifth***, create src folder and make its structure identical to this:

```
Project Root
├── src
│   ├── packs
│   │   ├── (Behavior pack folder)
│   │   │   └── (Behavior pack files and folders)
│   │   └── (Resource pack folder)
│   │       └── (Resource pack files and folders)
│   └── scripts
│       ├── main.ts
│       └── (Script files)
└── (Other files and folders)
```

### Config properties

- `minecraftComMojangDirectoryPath` [string] - Full path of com.mojang folder
- `fullAddonName` [string] - Full name of your addon (for example, "MyUntitledAddon")
- `shortAddonName` [string] - Short name of your addon (for example, "MUA")
- `behaviorPackDirectoryName` [string] - Name of the behavior pack directory name in src
- `resourcePackDirectoryName` [string] - Name of the resource pack directory name in src
- `externalModules` [string array] - List of modules/packages to be ignored by the bundler (it must contain "@minecraft")
- `entryScriptFileName` [string] - Name of the main script file without extension (for example, "main")
- `compilationIgnorePatterns` - List of glob patterns to exclude from pack compilation

## Commands

Run ``npx lcbuild --help`` see list of commands.

### Create development build

Example

```sh
npx lcbuild dev
```

#### Arguments

- `--bundleScripts` `-b` - Choose whether to bundle scripts
- `--minifyBundle` `-m` - Choose whether to minify bundled scripts when `--bundleScripts` flag is set to true
- `--copyToMc` `-c` - Choose whether to copy compiled packs to *development_behavior_packs* and *development_resource_packs* after the build process is finished


### Create release build

Example

```sh
npx lcbuild release --v 1 0 0 --s stable --i 1
```

#### Arguments

- `--bundleScripts` `-b` - Choose whether to bundle scripts
- `--minifyBundle` `-m` - Choose whether to minify bundled scripts when `--bundleScripts` flag is set to true
- `--copyToMc` `-c` - Choose whether to copy compiled packs to *development_behavior_packs* and *development_resource_packs* after the build process is finished
- `--releaseVersion` `-v` - Set release version in MAJOR MINOR PATCH format
- `--releaseStage` `-s` - Set release stage ("prealpha", "alpha", "beta", "rc", or "stable")
- `--releaseIteration` `-i` - Set release iteration/index as number

## History of LCBuild

This is how I was developing my addon in early 2023: *3 git repositories (one for behavior pack, one for resource pack, another one for scripts), 3 VSCode windows opened at same time, and manually copying script folder every time I compile them.*

After I realized that it was super unproductive, I made a Python script to automate those tedious tasks. It was fine but not ideal, because I write Minecraft scripts in TypeScript. So, I decided to rewrite it in Node.js and named it LCBuild.

## Contributing

LCBuild is an open-source project.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for more details.

## License

Licensed under [MIT](./LICENSE)
