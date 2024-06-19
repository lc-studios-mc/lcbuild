# LCBuild

A quick overview of what you can achieve with LCBuild:

- TypeScript support
- Centralized project directory
- One command to compile and copy your packs to Minecraft
- Automatic manifest.json UUID generation for release builds

## Prerequisites

LCBuild only runs on Windows 10/11 and requires [Node.js]((http://nodejs.org/)) version 14 or later. 

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
  - [Useful commands](#useful-commands)
    - [Create development build](#create-development-build)
    - [Create release build](#create-release-build)
  - [History of LCBuild](#history-of-lcbuild)

## Why use LCBuild

If you are making a Minecraft addon, you will probably feel (or already felt) that putting your projects directly inside development_behavior_pack and development_resource_pack is not really good.

And if you want to use TypeScript in a behavior pack inside development_behavior_pack, you will not have a good time.

With LCBuild, you can say goodbye to those nightmares!

## Installation

**BEFORE YOU INSTALL:** please read the [prerequisites](#prerequisites)

First, create a folder somewhere on your drive (C:\ or not does not matter) and open it in terminal.

Second, run the command:

```sh
npm init -y
npm i @lc-studio/lcbuild typescript --save-dev
npm i @minecraft/server@latest @minecraft/server-ui@latest --save-exact
tsc --init
```

Third, run the command:

```sh
npx lcbuild
```

This will generate a folder named ".lcbuild" in your project folder, which contains files used by LCBuild.

Fourth, open **config.json** inside .lcbuild and change properties to your preferences.

### Config properties

- `minecraftComMojangDirectoryPath` - Path to com.mojang folder
- `fullAddonName` - Full name of your addon
- 

## Useful commands

### Create development build

### Create release build

## History of LCBuild

This is how I was developing my addon in early 2023: *3 git repositories (one for behavior pack, one for resource pack, another one for scripts), 3 VSCode windows opened at same time, and manually copying script folder every time I compile them.*

After I realized that it was super unproductive, I made a Python script to automate those tedious tasks. It was fine but not ideal, because I write Minecraft scripts in TypeScript. So, I decided to rewrite it in Node.js and named it LCBuild.
