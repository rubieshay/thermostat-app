export enum TempUnits {celsius=0, fahrenheit=1};
export enum TempMode {heat="HEAT", cool="COOL", heatcool="HEATCOOL", off="OFF"};
export enum HvacStatus {heating="HEATING", cooling="COOLING", off="OFF"};
export enum EcoMode {on="MANUAL_ECO", off="OFF"};

export const debounceTime: number = 3000
 
export const minDialTemps: number[] = [9, 50];
export const maxDialTemps: number[] = [32, 90];
export const decimalPrecision: number[] = [0.5, 1.0];
export const usedDialRatio: number = 0.85;

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

export function roundedTemp(tempVal: number | null, tempunits: TempUnits): number | null {
    if (tempVal === null) {
        return null;
    }
    return Math.round(tempVal / decimalPrecision[tempunits]) * decimalPrecision[tempunits];
}

export const DEFAULT_API_URL = import.meta.env.VITE_DEFAULT_API_URL === undefined ? "https://thermostat.shaytech.net/api" : import.meta.env.VITE_DEFAULT_API_URL;