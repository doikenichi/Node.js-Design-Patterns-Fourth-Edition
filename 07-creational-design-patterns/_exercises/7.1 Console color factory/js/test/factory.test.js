import assert from "node:assert/strict";
import { suite, test } from "node:test";

// This is the public API that ordinary callers use.
import { COLORS, createConsoleLog } from "../consoleLogger/index.js";

// These internal imports let this factory unit test verify its selection rule.
// They are not part of the public consoleLogger API.
import { BlueConsole } from "../consoleLogger/consoleBlue.js";
import { GreenConsole } from "../consoleLogger/consoleGreen.js";
import { RedConsole } from "../consoleLogger/consoleRed.js";

suite("createConsoleLog", () => {
  // One table covers the equivalent supported-color cases without
  // duplicating the Arrange-Act-Assert structure.
  const supportedColors = [
    { color: COLORS.RED, expectedConstructor: RedConsole },
    { color: COLORS.BLUE, expectedConstructor: BlueConsole },
    { color: COLORS.GREEN, expectedConstructor: GreenConsole },
  ];

  for (const { color, expectedConstructor } of supportedColors) {
    test(`creates a ${color} console`, () => {
      // Act: ask the factory to select and create a console.
      const colorConsole = createConsoleLog(color);

      // Assert type, not identity. Each factory call creates a new object,
      // so strictEqual against a separate `new RedConsole()` is incorrect.
      assert.ok(colorConsole instanceof expectedConstructor);
    });
  }

  test("rejects an unsupported color", () => {
    // This prevents a future change from silently falling back to a color.
    assert.throws(() => createConsoleLog("purple"), /Unsupported format/);
  });
});
