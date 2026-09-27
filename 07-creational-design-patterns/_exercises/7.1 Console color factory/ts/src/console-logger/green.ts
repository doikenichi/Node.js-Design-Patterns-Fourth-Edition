import {fgGreen, resetColor} from "./constants.js";
import  {ColorConsole} from "./color-console.js";

export class GreenConsole extends  ColorConsole {
    log(text: string): void {
        console.log("%s%s%s", fgGreen, text, resetColor);
    }
}
