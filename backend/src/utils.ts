export enum TempCommands {
    setHeat = "sdm.devices.commands.ThermostatTemperatureSetpoint.SetHeat",
    setCool = "sdm.devices.commands.ThermostatTemperatureSetpoint.SetCool",
    setRange = "sdm.devices.commands.ThermostatTemperatureSetpoint.SetRange",
    setMode = "sdm.devices.commands.ThermostatMode.SetMode",
    setEcoMode = "sdm.devices.commands.ThermostatEco.SetMode",
    setFan = "sdm.devices.commands.Fan.SetTimer"
}

export const deviceTypeThermostat = "sdm.devices.types.THERMOSTAT";

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

export function splitURLsByCommaToArray(urls: string | null) {
    if (urls === null) {return []};
    let initArray : string[] = [];
    initArray = urls.split(",");
    let fixedArray: string[] = [];
    for (const url of initArray) {
        fixedArray.push(stripSlashFromURLIfThere(url.trim()));
    }
    return fixedArray;
}

export function originInCorsList(origin: string, CORSArray: string[] | null): boolean {
    if (CORSArray === null) return true; // CORS checking off if no array passed;
    let inList = false;
    for (const corsEntry of CORSArray) {
        if (origin.includes(corsEntry)) {inList = true;}
    }
    return inList;
}

export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}