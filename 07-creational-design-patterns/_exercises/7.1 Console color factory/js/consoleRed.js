import {ColorConsole} from "./colorConsole.js";
import {resetColor, fgRed} from "./ansiCodes.js";

export class RedConsole extends ColorConsole {

    log(text) {
        console.log("%s%s%s", fgRed, text, resetColor);
    }
}
