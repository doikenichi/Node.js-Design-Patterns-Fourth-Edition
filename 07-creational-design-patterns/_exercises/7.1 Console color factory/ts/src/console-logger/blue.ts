import {fgBlue, resetColor} from "./constants.js";
import  {ColorConsole} from "./color-console.js";

export class BlueConsole extends  ColorConsole {
    log(text:string):void {
        console.log("%s%s%s", fgBlue, text, resetColor);
    }
}
