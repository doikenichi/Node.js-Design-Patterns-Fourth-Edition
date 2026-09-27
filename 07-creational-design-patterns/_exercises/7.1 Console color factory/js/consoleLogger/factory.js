import { COLORS } from "./constants.js";
import { RedConsole } from "./consoleRed.js";
import { BlueConsole } from "./consoleBlue.js";
import { GreenConsole } from "./consoleGreen.js";

export function createConsoleLog(color) {
  switch (color) {
    case COLORS.RED:
      return new RedConsole();
    case COLORS.BLUE:
      return new BlueConsole();
    case COLORS.GREEN:
      return new GreenConsole();
  }
  throw new Error("Unsupported format");
}
