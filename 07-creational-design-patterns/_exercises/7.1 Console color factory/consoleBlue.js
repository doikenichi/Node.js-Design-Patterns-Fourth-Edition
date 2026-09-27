import { ColorConsole} from "./colorConsole.js";
import {closing, fgBlue} from "./consoleConstants.js";

export class BlueConsole extends ColorConsole {
    log(text) {
        console.log("%s%s%s", fgBlue, text, closing);
    }
}
