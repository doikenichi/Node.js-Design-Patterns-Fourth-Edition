import {ColorConsole} from "./colorConsole.js";

export class BlueConsole extends ColorConsole {
    #fgBlue = "\x1b[34m";

    constructor() {
        super();
    }

    log(text) {
        console.log("%s%s%s", this.#fgBlue, text, this.#fgBlue);
    }
}
