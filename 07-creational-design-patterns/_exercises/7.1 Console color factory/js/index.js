import {RedConsole} from './consoleRed.js'
import {BlueConsole} from './consoleBlue.js'
import {GreenConsole} from './consoleGreen.js'

// group all related values into one object:
export const COLORS = Object.freeze({
    RED: "red",
    BLUE: "blue",
    GREEN: "green",
});

function createConsoleLog(color) {
    switch (color) {
        case COLORS.RED:
            return new RedConsole();
        case COLORS.BLUE:
            return new BlueConsole();
        case COLORS.GREEN:
            return new GreenConsole();
    }
    throw new Error('Unsupported format')
}

const redLogger = createConsoleLog(COLORS.RED);
const blueLogger = createConsoleLog(COLORS.BLUE);
const greenLogger = createConsoleLog(COLORS.GREEN);

redLogger.log('Hello from red');
blueLogger.log('Hello from blue');
greenLogger.log('Hello from green');
