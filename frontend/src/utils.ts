import { TempUnits } from "./types";

export const demoMode = ((window as any)._env_.DEMO_MODE === "TRUE" ||
                         (window as any)._env_.DEMO_MODE === "1" ||
                         (window as any)._env_.DEMO_MODE === "YES") ? true : false;

export const debounceTime: number = 3000;
export const responseWaitTime: number = 5000;
export const setPointFadeDelay: number = 3000;
export const setPointFadeDuration: number = 1000;
 
export const minDialTemps: number[] = [9, 50];
export const maxDialTemps: number[] = [32, 90];
export const decimalPrecision: number[] = [0.5, 1.0];
export const usedDialRatio: number = 5/6;

export function convertTemp(tempVal: number | null, inputUnits: TempUnits, outputUnits: TempUnits): number | null {
    if (tempVal === null){
        return null;
    } else if (inputUnits === outputUnits) {
        // No Conversion
        return tempVal
    } else if (inputUnits === TempUnits.fahrenheit) {
        // F to C
        return (tempVal - 32) * (5/9);
    } else {
        // C to F
        return (tempVal * (9/5)) + 32;
    }
}

export function roundedTemp(tempVal: number | null, tempUnits: TempUnits): number | null {
    if (tempVal === null) {
        return null;
    }
    return Math.round(tempVal / decimalPrecision[tempUnits]) * decimalPrecision[tempUnits];
}
