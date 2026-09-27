import { ColorConsole } from "./colorConsole.js";
import { fgGreen, resetColor } from "./constants.js";

export class GreenConsole extends ColorConsole {
  log(text) {
    console.log("%s%s%s", fgGreen, text, resetColor);
  }
}
