import {describe, expect, test} from 'vitest'

// This is the public API that ordinary callers use.
import {COLORS, createConsoleLog} from "../consoleLogger/index.js";

// These internal imports let this factory unit test verify its selection rule.
// They are not part of the public consoleLogger API.
import {BlueConsole} from "../consoleLogger/consoleBlue.js";
import {GreenConsole} from "../consoleLogger/consoleGreen.js";
import {RedConsole} from "../consoleLogger/consoleRed.js";


describe("createConsoleLog factory", {concurrency: true}, () => {
    // One table covers the equivalent supported-color cases without
    // duplicating the Arrange-Act-Assert structure.
    test.concurrent.for([
        {color: COLORS.RED, expectedConstructor: RedConsole},
        {color: COLORS.BLUE, expectedConstructor: BlueConsole},
        {color: COLORS.GREEN, expectedConstructor: GreenConsole},
    ])(`type $color creates a $expectedConstructor console logger`, ({color, expectedConstructor}, {expect}) => {
        // Act: ask the factory to select and create a console.
        const colorConsole = createConsoleLog(color);

        // Assert type, not identity. Each factory call creates a new object,
        // so strictEqual against a separate `new RedConsole()` is incorrect.
        expect(colorConsole).instanceof(expectedConstructor);
    });

    test("rejects an unsupported color", () => {
        // This prevents a future change from silently falling back to a color.
        expect(() => createConsoleLog("purple")).toThrow(/Unsupported format/);
    });
});
