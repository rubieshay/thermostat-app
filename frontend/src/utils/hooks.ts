import { useCallback, useContext, useEffect, useRef } from "react";
import { useNavigate, useLocation } from 'react-router';
import { App } from '@capacitor/app';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
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

export const useBackButtonHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only handle back button on native platforms
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const handleBackButton = () => {
      const currentPath = location.pathname;
      
      // Define your root routes where back button should exit the app
      const rootRoutes = ['/','/enterurl'];
      
      console.log({currentPath, rootRoutes});
      if (rootRoutes.includes(currentPath)) {
        // Exit app if on root route
        App.exitApp();
      } else {
        // Navigate back in history
        navigate(-1);
      }
    };

    // Add the back button listener
    let backButtonListener: PluginListenerHandle;
    
    const setupListener = async () => {
      backButtonListener = await App.addListener('backButton', handleBackButton);
    };
    
    setupListener();

    // Cleanup on unmount
    return () => {
      if (backButtonListener) {
        backButtonListener.remove();
      }
    };
  }, [navigate, location.pathname]);
};