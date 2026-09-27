import { ColorConsole } from "./colorConsole.js";
import {closing, fgGreen} from "./consoleConstants.js";

export class GreenConsole extends ColorConsole {

  log(text) {
    console.log("%s%s%s", fgGreen, text, closing);
  }
}
