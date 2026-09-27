import {ColorConsole} from "./colorConsole.js";
import {fgRed, resetColor} from "./constants.js";

export class RedConsole extends ColorConsole {
    log(text) {
        console.log("%s%s%s", fgRed, text, resetColor);
    }
}
