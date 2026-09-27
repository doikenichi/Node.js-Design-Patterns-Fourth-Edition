// group all related values into one object:
export const COLORS = Object.freeze({
    RED: "red",
    BLUE: "blue",
    GREEN: "green",
});
export type Color = typeof COLORS[keyof typeof COLORS];

export const resetColor = "\x1b[0m";
export const fgBlue = "\x1b[34m";
export const fgGreen = "\x1b[32m";
export const fgRed = "\x1b[31m";
