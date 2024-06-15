import { colors } from "./colors";

export function print(message: any): void {
  console.log(message);
}

export function printOkGreen(message: any): void {
  console.log(`${colors.fgGreen}${message}${colors.reset}`);
}

export function printOkCyan(message: any): void {
  console.log(`${colors.fgCyan}${message}${colors.reset}`);
}

export function printWarn(message: any): void {
  console.log(`${colors.fgYellow}${message}${colors.reset}`);
}

export function printError(message: any): void {
  console.log(`${colors.fgRed}${message}${colors.reset}`);
}
