import { useEffect, useRef, useCallback } from "react";
import { HvacStatus, TempUnits, TempMode, EcoMode, type FetchReturn } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const demoMode = ((window as any)._env_.DEMO_MODE === "TRUE" ||
                         (window as any)._env_.DEMO_MODE === "1" ||
                         (window as any)._env_.DEMO_MODE === "YES") ? true : false;
export const defaultAPIURL = (window as any)._env_.DEFAULT_API_URL ? (window as any)._env_.DEFAULT_API_URL : "http://localhost:5173/api";
export const dataRefreshEnabled =((window as any)._env_.DATA_REFRESH_ENABLED === "TRUE" || 
                                  (window as any)._env_.DATA_REFRESH_ENABLED === "1" ||
                                  (window as any)._env_.DATA_REFRESH_ENABLED === "YES") ? true : false;
/* eslint-enable @typescript-eslint/no-explicit-any */                                  
console.debug("Environment driven settings:", {demoMode, defaultAPIURL, dataRefreshEnabled});

export const debounceTime: number = 3000;
export const dataRefreshTime: number = 60000;
export const setPointFadeDuration: number = 3000;
export const drawerTimeoutDuration: number = 500;
export const fanTimerDisplayUpdateInterval: number = 15000;
 
export const minDialTemps: number[] = [9, 50];
export const maxDialTemps: number[] = [32, 90];
export const minRangeGap: number[] = [1.5, 3]
export const decimalPrecision: number[] = [0.5, 1.0];
export const usedDialRatio: number = 5/6;


// Material Symbols unicode values for reference

// \ue145 - add
// \ue15b - remove

// \uf168 - mode_fan
// \uec17 - mode_fan_off
// \uf537 - heat
// \uf557 - mode_dual
// \uf166 - mode_cool
// \uf16f - mode_off_on
// \uf8be - nest_eco_leaf

// \ue629 - sync_problem
// \ue575 - not_listed_location

// \ue88a - home

// \uf163 - humidity_high
// \uf164 - humidity_low
// \uf165 - humidity_mid

// \ue81a - sunny
// \uf172 - partly_cloudy_day
// \ue2bd - cloud
// \uf176 - rainy
// \ue2cd - weather_snowy
// \uf60b - weather_mix
// \uf67f - weather_hail
// \uebdb - thunderstorm
// \ue818 - foggy
// \ue188 - mist
// \ue199 - tornado
// \uebd5 - cyclone
// \uf070 - storm
// \uebd3 - severe_cold
// \uf4e5 - emergency_heat_2

// \uf34f - moon_stars
// \uf174 - partly_cloudy_night


export const tempModeOptions = [{tempMode: TempMode.heat, idText: "heat",
                                 dispText: "Heat", symbolText: "\uf537"},
                                {tempMode: TempMode.heatcool, idText: "heatcool",
                                 dispText: "Heat • Cool", symbolText: "\uf557"},
                                {tempMode: TempMode.cool, idText: "cool",
                                 dispText: "Cool", symbolText: "\uf166"},
                                {tempMode: TempMode.off, idText: "off",
                                 dispText: "Off", symbolText: "\uf16f"}]
export const ecoModeOptions = [{"ecoMode": EcoMode.on, idText: "on",
                                dispText: "On", symbolText: "\uf8be"},
                               {"ecoMode": EcoMode.off, idText: "off",
                                dispText: "Off", symbolText: "\uf16f"}]
export const fanTimerOptions = [{duration: 900, dispText: "15 min"},
                                {duration: 1800, dispText: "30 min"},
                                {duration: 2700, dispText: "45 min"},
                                {duration: 3600, dispText: "1 hr"},
                                {duration: 7200, dispText: "2 hr"},
                                {duration: 14400, dispText: "4 hr"},
                                {duration: 28800, dispText: "8 hr"},
                                {duration: 43200, dispText: "12 hr"}]

export const humidityRanges = [{rangeEnd: 0, symbolText: "\uf164"},
                                {rangeEnd: 40, symbolText: "\uf165"},
                                {rangeEnd: 60, symbolText: "\uf163"}]

export const weatherIcons = {
    day: {
        skc: {symbolText: "\ue81a", ariaText: "Sunny"},
        few: {symbolText: "\ue81a", ariaText: "Sunny"},
        sct: {symbolText: "\uf172", ariaText: "Partly Cloudy (Day)"},
        bkn: {symbolText: "\uf172", ariaText: "Partly Cloudy (Day)"},
        ovc: {symbolText: "\ue2bd", ariaText: "Cloudy"},
        wind_skc: {symbolText: "\ue81a", ariaText: "Sunny"},
        wind_few: {symbolText: "\ue81a", ariaText: "Sunny"},
        wind_sct: {symbolText: "\uf172", ariaText: "Partly Cloudy (Day)"},
        wind_bkn: {symbolText: "\uf172", ariaText: "Partly Cloudy (Day)"},
        wind_ovc: {symbolText: "\ue2bd", ariaText: "Cloudy"},
        snow: {symbolText: "\ue2cd", ariaText: "Snowy"},
        rain_snow: {symbolText: "\uf60b", ariaText: "Wintry Mix"},
        rain_sleet: {symbolText: "\uf60b", ariaText: "Wintry Mix"},
        snow_sleet: {symbolText: "\uf60b", ariaText: "Wintry Mix"},
        fzra: {symbolText: "\uf67f", ariaText: "Freezing Rain / Sleet / Hail"},
        rain_fzra: {symbolText: "\uf60b", ariaText: "Wintry Mix"},
        snow_fzra: {symbolText: "\uf60b", ariaText: "Wintry Mix"},
        sleet: {symbolText: "\uf67f", ariaText: "Freezing Rain / Sleet / Hail"},
        rain: {symbolText: "\uf176", ariaText: "Rainy"},
        rain_showers: {symbolText: "\uf176", ariaText: "Rainy"},
        rain_showers_hi: {symbolText: "\uf176", ariaText: "Rainy"},
        tsra: {symbolText: "\uebdb", ariaText: "Thunderstorms"},
        tsra_sct: {symbolText: "\uebdb", ariaText: "Thunderstorms"},
        tsra_hi: {symbolText: "\uebdb", ariaText: "Thunderstorms"},
        tornado: {symbolText: "\ue199", ariaText: "Tornado"},
        hurricane: {symbolText: "\uebd5", ariaText: "Hurricane"},
        tropical_storm: {symbolText: "\uf070", ariaText: "Tropical Storm"},
        dust: {symbolText: "\ue188", ariaText: "Dust / Smoke"},
        smoke: {symbolText: "\ue188", ariaText: "Dust / Smoke"},
        haze: {symbolText: "\ue818", ariaText: "Foggy / Haze"},
        hot: {symbolText: "\uf4e5", ariaText: "Extreme Heat"},
        cold: {symbolText: "\uebd3", ariaText: "Extreme Cold"},
        blizzard: {symbolText: "\ue2cd", ariaText: "Snowy"},
        fog: {symbolText: "\ue818", ariaText: "Foggy / Haze"}
    },
    night: {
        skc: {symbolText: "\uf34f", ariaText: "Clear Night"},
        few: {symbolText: "\uf34f", ariaText: "Clear Night"},
        sct: {symbolText: "\uf174", ariaText: "Partly Cloudy (Night)"},
        bkn: {symbolText: "\uf174", ariaText: "Partly Cloudy (Night)"},
        wind_skc: {symbolText: "\uf34f", ariaText: "Clear Night"},
        wind_few: {symbolText: "\uf34f", ariaText: "Clear Night"},
        wind_sct: {symbolText: "\uf174", ariaText: "Partly Cloudy (Night)"},
        wind_bkn: {symbolText: "\uf174", ariaText: "Partly Cloudy (Night)"},
    }
}

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
    if (apiIconString?.includes("night")) {
        for (const [key, value] of Object.entries(weatherIcons.night)) {
            if (apiIconString.includes(key)) {
                return value;
            }
        }
    } else {
        for (const [key, value] of Object.entries(weatherIcons.day)) {
            if (apiIconString?.includes(key)) {
                return value;
            }
        }
    }
    // default icon if icon url isn't given or something goes wrong
    return {symbolText: "\ue575", ariaText: "Weather Not Found"};
}

export type ChildrenProviderProps = {
    children: React.ReactNode;
}

interface UsePageVisibilityRefreshOptions {
    refreshData: (forceFlush: boolean) => void | Promise<FetchReturn>;
    onStart?: () => void;
    onStop?: () => void;
    refreshInterval: number; // in milliseconds, defaults to 5000
    okToStartRefresh: boolean
}

export const usePageVisibilityRefresh = ({refreshData, onStart, onStop, refreshInterval = dataRefreshTime, okToStartRefresh = false}: UsePageVisibilityRefreshOptions) => {
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const isRefreshingRef = useRef(false);

    const startIntervalRefresh = useCallback(() => {
        if (isRefreshingRef.current || !dataRefreshEnabled || !okToStartRefresh) {
            return;
        }        
        isRefreshingRef.current = true;
        onStart?.(); // Optional callback when starting
        
        intervalRef.current = setInterval(() => {
            refreshData(false); // Call refreshData every interval
        }, refreshInterval);
    }, [okToStartRefresh, refreshData, onStart, refreshInterval]);

    const stopIntervalRefresh = useCallback( () => {
        if (!isRefreshingRef.current || !dataRefreshEnabled) {
            return;
        }
        
        isRefreshingRef.current = false;
        onStop?.(); // Optional callback when stopping
        
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        } else {
            console.error("No interval to clear in stop Interval Refresh");
        }
    }, [onStop])

    useEffect(() => {

        const handleVisibilityChange = (evt: Event) => {
            if (document.visibilityState === "hidden" || evt.type === "pagehide") {
                stopIntervalRefresh();
            } else {
                startIntervalRefresh();
            }
        };

        // Add event listener
        document.addEventListener("visibilitychange", handleVisibilityChange);
        document.addEventListener("pagehide", handleVisibilityChange)

        // Start refresh if page is initially visible
        if (document.visibilityState !== "hidden" && okToStartRefresh) {
            startIntervalRefresh();
        }

        // Cleanup function
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            document.removeEventListener("pagehide", handleVisibilityChange);
            stopIntervalRefresh();
        };
    }, [startIntervalRefresh, stopIntervalRefresh,refreshData, onStart, onStop, refreshInterval,okToStartRefresh]);
};


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
      if (typeof val1 === 'object' && val1 !== null && typeof val2 === 'object' && val2 !== null) {
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

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}