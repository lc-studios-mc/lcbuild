import { LOGGER } from "../logger";
import { colors } from "./colors";

export function print(message: any): void {
  console.log(message);
  LOGGER.info(message);
}

export function printOkGreen(message: any): void {
  console.log(`${colors.fgGreen}${message}${colors.reset}`);
  LOGGER.info(message);
}

export function printOkCyan(message: any): void {
  console.log(`${colors.fgCyan}${message}${colors.reset}`);
  LOGGER.info(message);
}

export function printWarn(message: any): void {
  console.log(`${colors.fgYellow}${message}${colors.reset}`);
  LOGGER.warn(message);
}

export function printError(message: any): void {
  console.log(`${colors.fgRed}${message}${colors.reset}`);
  LOGGER.error(message);
}

export function printFatal(message: any): void {
  console.log(`${colors.underscore}${colors.fgRed}${colors.bgBlack}${message}${colors.reset}`);
  LOGGER.fatal(message);
}
