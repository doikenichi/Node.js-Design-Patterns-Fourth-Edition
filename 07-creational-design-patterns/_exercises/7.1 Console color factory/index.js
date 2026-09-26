import {RedConsole} from './consoleRed.js'
import {BlueConsole} from './consoleBlue.js'
import {GreenConsole} from './consoleGreen.js'

export const red = /^red$/
export const blue = /^blue$/
export const green = /^green$/

function createConsoleLog(color) {
    switch (color) {
        case red:
            return new RedConsole();
        case blue:
            return new BlueConsole();
        case green:
            return new GreenConsole();
    }
    throw new Error('Unsupported format')
}

const redLogger = createConsoleLog(red);
const blueLogger = createConsoleLog(blue);
const greenLogger = createConsoleLog(green);

redLogger.log('Hello from red');
blueLogger.log('Hello from blue');
greenLogger.log('Hello from green');
