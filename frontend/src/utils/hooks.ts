import { useCallback, useContext, useEffect, useRef } from "react";
import { TempUnits, TempUnitsSetting, type FetchReturn } from "../types";
import { dataRefreshTime, dataRefreshEnabled } from "./constants";
import { TempDataContext } from "../contexts/temp_data_context";
import { SettingsContext } from "../contexts/settings_context";


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

        const handleVisibilityChange = (event: Event) => {
            if (document.visibilityState === "hidden" || event.type === "pagehide") {
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
    }, [startIntervalRefresh, stopIntervalRefresh, refreshData, onStart, onStop, refreshInterval, okToStartRefresh]);
};

export const useActualTempUnits = (() => {
    const { selectedTempData } = useContext(TempDataContext);
    const { tempUnitsSetting } = useContext(SettingsContext);
    if (tempUnitsSetting === TempUnitsSetting.system) {
        return selectedTempData.tempUnits;
    } else {
        return (tempUnitsSetting === TempUnitsSetting.celsius ? TempUnits.celsius : TempUnits.fahrenheit);
    }
});