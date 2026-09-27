import {fgRed, resetColor} from "./constants.js";
import  {ColorConsole} from "./color-console.js";

export class RedConsole extends  ColorConsole {
    log(text: string): void {
        console.log("%s%s%s", fgRed, text, resetColor);
    }
}
