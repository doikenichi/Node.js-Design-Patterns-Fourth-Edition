import {afterEach, describe, test, vi} from 'vitest'
import {
    fgBlue,
    fgGreen,
    fgRed,
    resetColor,
} from "../src/console-logger/constants.js";
import {RedConsole} from "../src/console-logger/red.js";
import {BlueConsole} from "../src/console-logger/blue.js";
import {GreenConsole} from "../src/console-logger/green.js";

// Tests with spy should be run serially to avoid race conditions.
describe("color console logging", () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })
    test.for([
        {label: "RED", loggerType: RedConsole, expectedConsoleColor: fgRed},
        {label: "BLUE", loggerType: BlueConsole, expectedConsoleColor: fgBlue},
        {label: "GREEN", loggerType: GreenConsole, expectedConsoleColor: fgGreen},
    ])(`type $label prints in desired color`, ({loggerType, expectedConsoleColor}, {expect}) => {
        /*
         * reference about console.log spy: https://recca0120.github.io/en/2026/05/02/vitest-fail-on-console/
         */
        const consoleSpy = vi.spyOn(console, 'log')
            .mockImplementation(() => {
            }); // Suppress Output: Use .mockImplementation(() => {}) to keep your test terminal clean when testing expected logs or errors.
        // Arrange: instantiate the logger
        const logger = new loggerType();

        // Act: ask the factory to select and create a console.
        logger.log("test");

        // assert it was called with the expected message
        expect(consoleSpy).toHaveBeenCalledWith("%s%s%s",
            expectedConsoleColor,
            "test",
            resetColor)

        expect(consoleSpy).toHaveBeenCalledTimes(1)
    });

});