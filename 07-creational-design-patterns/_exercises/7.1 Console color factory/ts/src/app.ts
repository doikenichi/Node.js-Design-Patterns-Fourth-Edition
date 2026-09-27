import {COLORS, createConsoleLog} from "./console-logger/index.js";


const redLogger = createConsoleLog(COLORS.RED);
const blueLogger = createConsoleLog(COLORS.BLUE);
const greenLogger = createConsoleLog(COLORS.GREEN);

redLogger.log("Hello from red");
blueLogger.log("Hello from blue");
greenLogger.log("Hello from green");
