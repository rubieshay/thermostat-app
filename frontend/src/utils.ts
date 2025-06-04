import { TempUnits } from "./types";

export const demoMode = (import.meta.env.VITE_DEMO_MODE === "TRUE" ||
                         import.meta.env.VITE_DEMO_MODE === "1" ||
                         import.meta.env.VITE_DEMO_MODE === "YES") ? true : false;

export const debounceTime: number = 3000;
export const responseWaitTime: number = 5000;
export const setPointFadeDelay: number = 3000;
export const setPointFadeDuration: number = 1000;
 
export const minDialTemps: number[] = [9, 50];
export const maxDialTemps: number[] = [32, 90];
export const minRangeGap: number[] = [1.5, 3]
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

export function makeTempInRange(tempVal: number | null, tempUnits: TempUnits): number | null {
    if (tempVal === null) {
        return null;
    }
    return Math.min(Math.max(minDialTemps[tempUnits], tempVal), maxDialTemps[tempUnits])
}

export const DEFAULT_API_URL = import.meta.env.VITE_DEFAULT_API_URL === undefined ? "https://thermostat.shaytech.net/api" : import.meta.env.VITE_DEFAULT_API_URL;