import { ColorConsole } from "./colorConsole.js";
import {resetColor, fgGreen} from "./ansiCodes.js";

export class GreenConsole extends ColorConsole {

  log(text) {
    console.log("%s%s%s", fgGreen, text, resetColor);
  }
}
