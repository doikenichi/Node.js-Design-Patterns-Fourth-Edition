import {ColorConsole} from "./colorConsole.js";
import {closing, fgRed} from "./consoleConstants.js";

export class RedConsole extends ColorConsole {

    log(text) {
        console.log("%s%s%s", fgRed, text, closing);
    }
}
