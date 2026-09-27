import { ColorConsole } from "./colorConsole.js";
import { fgBlue, resetColor } from "./constants.js";

export class BlueConsole extends ColorConsole {
  log(text) {
    console.log("%s%s%s", fgBlue, text, resetColor);
  }
}
