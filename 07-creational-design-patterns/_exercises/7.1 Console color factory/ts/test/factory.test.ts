import {describe, expect, test} from 'vitest'
import {COLORS, createConsoleLog} from "../src/console-logger/index.js";
import {RedConsole} from "../src/console-logger/red.js";
import {BlueConsole} from "../src/console-logger/blue.js";
import {GreenConsole} from "../src/console-logger/green.js";


describe.concurrent("createConsoleLog factory",  () => {
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
        // @ts-expect-error Testing invalid runtime input intentionally.
        expect(() => createConsoleLog("purple")).toThrow(/Unsupported format/);
    });
});
