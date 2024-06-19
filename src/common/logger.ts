import pino from "pino";
import * as path from "node:path";
import * as projectPaths from "./projectPaths.js";

export const LOGGER = pino({
  transport: {
    target: "pino/file",
    options: {
      destination: path.join(projectPaths.LCBUILD_DIR, "logs", "latest.log"),
      mkdir: true,
    },
  },
});
