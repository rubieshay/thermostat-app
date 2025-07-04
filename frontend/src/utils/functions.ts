import { TempUnits, HvacStatus } from "../types";
import { decimalPrecision, minDialTemps, maxDialTemps, humidityRanges, weatherIcons } from "./constants";

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

export function getIsoDatePlusDuration(addSeconds: number) : string {
    const msTime = new Date(Date.now() + (addSeconds * 1000));
    return msTime.toISOString();
}

export function getMsUntilIsoDate(isoDateTime: string) : number {
    const endDateTime = Date.parse(isoDateTime);
    return endDateTime - Date.now();
}

export function getHoursAndMinutes(duration: number) : string | null {
    if (duration < 0) {
        return null;
    }
    const hoursInt = Math.floor(duration / (1000*60*60));
    const minutesInt = Math.round((duration - (hoursInt * (1000*60*60))) / (1000*60));
    let minutesString = "";
    if ((minutesInt > 0 || hoursInt > 0) && !(hoursInt > 0 && minutesInt == 60)) {
        minutesString += String(minutesInt) + " min";
    }
    if (hoursInt > 0) {
        if (minutesInt === 60) {
            return String(hoursInt + 1) + " hr " + minutesString;
        } else {
            return String(hoursInt) + " hr " + minutesString;
        }
    } else if (minutesInt > 0) {
        return minutesString;
    } else {
        return "";
    }
}

export function getFanTimerString(fanTimer: string | null, hvacStatus: HvacStatus) {
    if (fanTimer === null) {
        if (hvacStatus !== HvacStatus.off) {
            return "Auto";
        } else {
            return "Off";
        }
    } else {
        const timerString = getHoursAndMinutes(getMsUntilIsoDate(fanTimer));
        if (timerString === null) {
            return "Off";
        } else {
            return timerString;
        }
    }
}

export function isFanOn(fanTimer: string | null, hvacStatus: HvacStatus) {
    if (fanTimer === null) {
        if (hvacStatus !== HvacStatus.off) {
            return true;
        } else {
            return false;
        }
    } else {
        const timerString = getHoursAndMinutes(getMsUntilIsoDate(fanTimer));
        if (timerString === null) {
            return false;
        } else {
            return true;
        }
    }
}

export function getHumidityIcon(humidityPercent: number | null): string {
    let humiditySymbolText = humidityRanges[0].symbolText;
    if (humidityPercent === null) {
        return humiditySymbolText;
    }
    for (let i = 0; i < humidityRanges.length; i++) {
        if (humidityPercent < humidityRanges[i].rangeEnd) {
            return humiditySymbolText;
        } else {
            humiditySymbolText = humidityRanges[i].symbolText;
        }
    }
    return humiditySymbolText;
}

export function getWeatherIcon(apiIconString: string | null) {
    // default icon if icon url isn't given or something goes wrong
    const weatherNotFound = {symbolText: "\ue575", ariaText: "Weather Not Found"};
    if (apiIconString === null) {
        return weatherNotFound;
    }
    if (apiIconString?.includes("night")) {
        for (const [key, value] of Object.entries(weatherIcons.night)) {
            if (apiIconString.includes(key)) {
                return value;
            }
        }
    }
    for (const [key, value] of Object.entries(weatherIcons.day)) {
        if (apiIconString?.includes(key)) {
            return value;
        }
    }
    return weatherNotFound;
}



// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function arraysEqualIgnoreOrder<T extends Record<string, any>>(arr1: T[], arr2: T[]): boolean {
    // Check if arrays have the same length
    if (arr1.length !== arr2.length) {
        return false;
    }

    // Helper function to deeply compare two objects
    function objectsEqual(obj1: T, obj2: T): boolean {
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);

        // Check if objects have the same number of keys
        if (keys1.length !== keys2.length) {
            return false;
        }

        // Check if all keys and values match
        for (const key of keys1) {
            if (!(key in obj2)) {
                return false;
            }

            const val1 = obj1[key];
            const val2 = obj2[key];

            // Handle nested objects recursively
            if (typeof val1 === "object" && val1 !== null && typeof val2 === "object" && val2 !== null) {
                if (Array.isArray(val1) && Array.isArray(val2)) {
                    // For arrays, do a simple comparison (you might want to make this recursive too)
                    if (JSON.stringify(val1) !== JSON.stringify(val2)) {
                        return false;
                    }
                } else if (!Array.isArray(val1) && !Array.isArray(val2)) {
                    if (!objectsEqual(val1 as T, val2 as T)) {
                        return false;
                    }
                } else {
                    return false; // One is array, one is not
                }
            } else if (val1 !== val2) {
                return false;
            }
        }

        return true;
    }

    // For each object in arr1, find a matching object in arr2
    for (const obj1 of arr1) {
        let found = false;
        for (const obj2 of arr2) {
        if (objectsEqual(obj1, obj2)) {
            found = true;
            break;
        }
        }
        if (!found) {
        return false;
        }
    }

    return true;
}

export function stripSlashFromURLIfThere(url: string) {
    if (url.endsWith("/")) {
        return (url.slice(0,-1))
    } else {
        return url;
    }
}

export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}