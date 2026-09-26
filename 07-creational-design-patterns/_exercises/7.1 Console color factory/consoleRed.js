import {ColorConsole} from "./colorConsole.js";

export class RedConsole extends ColorConsole {
    #fgRed = "\x1b[31m";

    constructor() {
        super();
    }

    log(text) {
        console.log("%s%s%s", this.#fgRed, text, this.#fgRed);
    }
}
