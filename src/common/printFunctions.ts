import { LOGGER } from "./logger.js";
import { colors } from "./colors.js";

export function print(message: any): void {
  console.log(message);
  LOGGER.info(`Printed out: ${message}`);
}

export function printOkGreen(message: any): void {
  console.log(`${colors.fgGreen}${message}${colors.reset}`);
  LOGGER.info(`Printed out: ${message}`);
}

export function printOkCyan(message: any): void {
  console.log(`${colors.fgCyan}${message}${colors.reset}`);
  LOGGER.info(`Printed out: ${message}`);
}

export function printWarn(message: any): void {
  console.log(`${colors.fgYellow}${message}${colors.reset}`);
  LOGGER.warn(`Printed out: ${message}`);
}

export function printError(message: any): void {
  console.log(`${colors.fgRed}${message}${colors.reset}`);
  LOGGER.error(`Printed out: ${message}`);
}

export function printFatal(message: any): void {
  console.log(`${colors.underscore}${colors.fgRed}${colors.bgBlack}${message}${colors.reset}`);
  LOGGER.fatal(`Printed out: ${message}`);
}
