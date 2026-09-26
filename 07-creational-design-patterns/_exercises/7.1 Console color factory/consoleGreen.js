import {ColorConsole} from "./colorConsole.js";

export class GreenConsole extends ColorConsole {
    #fgGreen = "\x1b[32m";

    constructor() {
        super();
    }

    log(text) {
        console.log("%s%s%s", this.#fgGreen, text, this.#fgGreen);
    }
}
