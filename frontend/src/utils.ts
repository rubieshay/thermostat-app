import { TempUnits, type FetchReturn } from "./types";
import { useEffect, useRef, useCallback } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
console.log( "ENV IS: "+JSON.stringify((window as any)._env_))
export const demoMode = ((window as any)._env_.DEMO_MODE === "TRUE" ||
                         (window as any)._env_.DEMO_MODE === "1" ||
                         (window as any)._env_.DEMO_MODE === "YES") ? true : false;
export const defaultAPIURL = (window as any)._env_.DEFAULT_API_URL ? (window as any)._env_.DEFAULT_API_URL : "https://thermostat.shaytech.net/api";
export const dataRefreshEnabled =((window as any)._env_.DATA_REFRESH_ENABLED === "TRUE" || 
                                  (window as any)._env_.DATA_REFRESH_ENABLED === "1" ||
                                  (window as any)._env_.DATA_REFRESH_ENABLED === "YES") ? true : false;
/* eslint-enable @typescript-eslint/no-explicit-any */                                  
console.log("Environment driven settings:", {demoMode,defaultAPIURL,dataRefreshEnabled});

export const debounceTime: number = 3000;
export const dataRefreshTime: number = 15000;
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

export function getUTCDatePlusSeconds(addSeconds: number) : Date {
    return new Date(Date.now() + (addSeconds * 1000));
}

export function getTimeAfterISODate(isoDateTime: string) : number {
    const endDateTime = Date.parse(isoDateTime);
    return endDateTime - Date.now();
}

export function getHoursAndMinutes(duration: number) : string {
    if (duration < 0) {
        return "";
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

export type ChildrenProviderProps = {
    children: React.ReactNode;
}

interface UsePageVisibilityRefreshOptions {
    refreshData: () => void | Promise<FetchReturn>;
    onStart?: () => void;
    onStop?: () => void;
    refreshInterval: number; // in milliseconds, defaults to 5000
    initialLoadComplete: boolean
}

export const usePageVisibilityRefresh = ({refreshData, onStart, onStop, refreshInterval = dataRefreshTime, initialLoadComplete}: UsePageVisibilityRefreshOptions) => {
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const isRefreshingRef = useRef(false);

    const startIntervalRefresh = useCallback(() => {
        if (isRefreshingRef.current || !dataRefreshEnabled || !initialLoadComplete) return;
        
        isRefreshingRef.current = true;
        onStart?.(); // Optional callback when starting
        refreshData(); // Initial call to fetch data
        
        intervalRef.current = setInterval(() => {
        refreshData(); // Call refreshData every interval
        }, refreshInterval);
    }, [initialLoadComplete, refreshData, onStart, refreshInterval]);

    const stopIntervalRefresh = useCallback( () => {
        if (!isRefreshingRef.current || !dataRefreshEnabled) return;
        
        isRefreshingRef.current = false;
        onStop?.(); // Optional callback when stopping
        
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
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
        if (document.visibilityState !== "hidden") {
            console.log("Page visible at startup, starting interval refresh...");
            startIntervalRefresh();
        }

        // Cleanup function
        return () => {
            console.log("Cleaning up interval timers and visibility listeners");
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            document.removeEventListener("pagehide", handleVisibilityChange);
            stopIntervalRefresh();
        };
    }, [startIntervalRefresh, stopIntervalRefresh,refreshData, onStart, onStop, refreshInterval,initialLoadComplete]);
};