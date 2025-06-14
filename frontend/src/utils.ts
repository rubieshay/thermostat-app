import { useEffect, useRef, useCallback } from "react";
import { HvacStatus, TempUnits, TempMode, EcoMode, type FetchReturn } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */
console.log("ENV IS: " +  JSON.stringify((window as any)._env_))
export const demoMode = ((window as any)._env_.DEMO_MODE === "TRUE" ||
                         (window as any)._env_.DEMO_MODE === "1" ||
                         (window as any)._env_.DEMO_MODE === "YES") ? true : false;
export const defaultAPIURL = (window as any)._env_.DEFAULT_API_URL ? (window as any)._env_.DEFAULT_API_URL : "http://localhost:5173/api";
export const dataRefreshEnabled =((window as any)._env_.DATA_REFRESH_ENABLED === "TRUE" || 
                                  (window as any)._env_.DATA_REFRESH_ENABLED === "1" ||
                                  (window as any)._env_.DATA_REFRESH_ENABLED === "YES") ? true : false;
/* eslint-enable @typescript-eslint/no-explicit-any */                                  
console.log("Environment driven settings:", {demoMode, defaultAPIURL, dataRefreshEnabled});

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

export const tempModeOptions = [{tempMode: TempMode.heat, idText: "heat",
                                 dispText: "Heat", symbolText: "heat"},
                                {tempMode: TempMode.heatcool, idText: "heatcool",
                                 dispText: "Heat • Cool", symbolText: "mode_dual"},
                                {tempMode: TempMode.cool, idText: "cool",
                                 dispText: "Cool", symbolText: "mode_cool"},
                                {tempMode: TempMode.off, idText: "off",
                                 dispText: "Off", symbolText: "mode_off_on"}]
export const ecoModeOptions = [{"ecoMode": EcoMode.on, idText: "on",
                                dispText: "On", symbolText: "nest_eco_leaf"},
                               {"ecoMode": EcoMode.off, idText: "off",
                                dispText: "Off", symbolText: "mode_off_on"}]
export const fanTimerOptions = [{duration: 900, dispText: "15 min"},
                                {duration: 1800, dispText: "30 min"},
                                {duration: 2700, dispText: "45 min"},
                                {duration: 3600, dispText: "1 hr"},
                                {duration: 7200, dispText: "2 hr"},
                                {duration: 14400, dispText: "4 hr"},
                                {duration: 28800, dispText: "8 hr"},
                                {duration: 43200, dispText: "12 hr"}]

export const humidityRanges = [{rangeEnd: 0, symbolText: "humidity_low"},
                                {rangeEnd: 40, symbolText: "humidity_mid"},
                                {rangeEnd: 60, symbolText: "humidity_high"}]

export const weatherIcons = {
    day: {
        skc: "sunny",
        few: "sunny",
        sct: "partly_cloudy_day",
        bkn: "partly_cloudy_day",
        ovc: "cloud",
        wind_skc: "sunny",
        wind_few: "sunny",
        wind_sct: "partly_cloudy_day",
        wind_bkn: "partly_cloudy_day",
        wind_ovc: "cloud",
        snow: "weather_snowy",
        rain_snow: "weather_mix",
        rain_sleet: "weather_mix",
        snow_sleet: "weather_mix",
        fzra: "weather_hail",
        rain_fzra: "weather_mix",
        snow_fzra: "weather_mix",
        sleet: "weather_hail",
        rain: "rainy",
        rain_showers: "rainy",
        rain_showers_hi: "rainy",
        tsra: "thunderstorm",
        tsra_sct: "thunderstorm",
        tsra_hi: "thunderstorm",
        tornado: "tornado",
        hurricane: "hurricane",
        tropical_storm: "storm",
        dust: "mist",
        smoke: "mist",
        haze: "foggy",
        hot: "emergency_heat_2",
        cold: "severe_cold",
        blizzard: "weather_snowy",
        fog: "foggy"
    },
    night: {
        skc: "moon_stars",
        few: "moon_stars",
        sct: "partly_cloudy_night",
        bkn: "partly_cloudy_night",
        wind_skc: "moon_stars",
        wind_few: "moon_stars",
        wind_sct: "partly_cloudy_night",
        wind_bkn: "partly_cloudy_night",
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

export function getWeatherIcon(apiIconString: string | null): string {
    if (apiIconString?.includes("night")) {
        for (const [key, value] of Object.entries(weatherIcons.night)) {
            if (apiIconString.includes(key)) {
                return value;
            }
        }
    } else {
        for (const [key, value] of Object.entries(weatherIcons.night)) {
            if (apiIconString?.includes(key)) {
                return value;
            }
        }
    }
    // default icon if icon url isn't given or something goes wrong
    return "thermostat";
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
            console.log("NOT starting timer because:", {isRefreshingRef: isRefreshingRef.current, dataRefreshEnabled, okToStartRefresh});
            return;
        }        
        isRefreshingRef.current = true;
        onStart?.(); // Optional callback when starting
        
        intervalRef.current = setInterval(() => {
            console.log("Triggering refreshData from page vis timer");
            refreshData(false); // Call refreshData every interval
        }, refreshInterval);
    }, [okToStartRefresh, refreshData, onStart, refreshInterval]);

    const stopIntervalRefresh = useCallback( () => {
        if (!isRefreshingRef.current || !dataRefreshEnabled) {
            console.log("Stop Interval Refresh cancelled - not currently refreshing or refresh not enabled");
            return;
        }
        
        isRefreshingRef.current = false;
        onStop?.(); // Optional callback when stopping
        
        if (intervalRef.current) {
            console.log("Actually clearing interval in stopIntervalRefresh");
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        } else {
            console.log("No interval to clear in stop Interval Refresh");
        }
    }, [onStop])

    useEffect(() => {

        const handleVisibilityChange = (evt: Event) => {
            if (document.visibilityState === "hidden" || evt.type === "pagehide") {
                console.log("Page hidden, stopping interval timer");
                stopIntervalRefresh();
            } else {
                console.log("Page back, starting refresh cycles");
                startIntervalRefresh();
            }
        };

        // Add event listener
        document.addEventListener("visibilitychange", handleVisibilityChange);
        document.addEventListener("pagehide", handleVisibilityChange)

        // Start refresh if page is initially visible
        if (document.visibilityState !== "hidden" && okToStartRefresh) {
            console.log("Page visible at startup, NOT YET... starting first load and timer...");
            startIntervalRefresh();
//            doInitialAndStart();
        }

        // Cleanup function
        return () => {
            console.log("Cleaning up interval timers and visibility listeners");
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