import { ColorConsole} from "./colorConsole.js";
import {resetColor, fgBlue} from "./ansiCodes.js";

export class BlueConsole extends ColorConsole {
    log(text) {
        console.log("%s%s%s", fgBlue, text, resetColor);
    }
}
