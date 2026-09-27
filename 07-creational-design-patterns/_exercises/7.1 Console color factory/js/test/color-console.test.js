import {afterEach, describe, expect, test, vi} from 'vitest'
import {COLORS, createConsoleLog} from "../consoleLogger/index.js";
import {fgBlue, fgGreen, fgRed, resetColor} from "../consoleLogger/constants.js";
import {ColorConsole} from "../consoleLogger/colorConsole.js";

// Tests with spy should be run serially to avoid race conditions.
describe("color console logging", {concurrency: false}, () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })
    test.for([
        {color: COLORS.RED, expectedConsoleColor: fgRed},
        {color: COLORS.BLUE, expectedConsoleColor: fgBlue},
        {color: COLORS.GREEN, expectedConsoleColor: fgGreen},
    ])(`type $color prints in desired color $expectedConsoleColor`, ({color, expectedConsoleColor}, {expect}) => {
        /*
         * reference about console.log spy: https://recca0120.github.io/en/2026/05/02/vitest-fail-on-console/
         */
        const consoleSpy = vi.spyOn(console, 'log')
            .mockImplementation(() => {
            }); // Suppress Output: Use .mockImplementation(() => {}) to keep your test terminal clean when testing expected logs or errors.

        // Act: ask the factory to select and create a console.
        const colorConsole = createConsoleLog(color);
        colorConsole.log("test");

        // assert it was called with the expected message
        expect(consoleSpy).toHaveBeenCalledWith("%s%s%s",
            expectedConsoleColor,
            "test",
            resetColor)
    });

    test("base ColorConsole throws not implemented logger", () => {
        // This prevents a future change from silently falling back to a color.
        expect(() => new ColorConsole().log("text")).toThrow(/Not implemented/);
    });

});