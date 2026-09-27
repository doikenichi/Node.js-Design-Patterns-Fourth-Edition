import type {ColorConsole} from "./color-console.js";
import {RedConsole} from "./red.js";
import {BlueConsole} from "./blue.js";
import {GreenConsole} from "./green.js";
import {type Color, COLORS} from "./constants.js";

export function createConsoleLog(color: Color): ColorConsole {
    switch (color) {
        case COLORS.RED:
            return new RedConsole();
        case COLORS.BLUE:
            return new BlueConsole();
        case COLORS.GREEN:
            return new GreenConsole();
        default:
            throw new Error("Unsupported format");
    }
}
