import { useCallback, useContext, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { App } from "@capacitor/app";
import { Capacitor, type PluginListenerHandle } from "@capacitor/core";
import { TempUnits, TempUnitsSetting, type FetchReturn } from "../types";
import { dataRefreshTime, dataRefreshEnabled } from "./constants";
import { TempDataContext } from "../contexts/temp_data_context";
import { SettingsContext } from "../contexts/settings_context";
import { WeatherContext } from "../contexts/weather_context";
import { APIContext } from "../contexts/api_context";
import { useFontLoader } from "../loading/font_loader";
import { demoMode } from "../utils/constants";

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
    const appStateChangeListenerRef = useRef<PluginListenerHandle>(null)

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
    }, [onStop]);

    useEffect(() => {

        const handleVisibilityChange = (active: boolean) => {
            if (active) {
              startIntervalRefresh();
                
            } else {
              stopIntervalRefresh();
            }
        };

        const addListeners = async () => {
            appStateChangeListenerRef.current = await App.addListener("appStateChange", ({isActive}) => {
                handleVisibilityChange(isActive)
            })
            // document.addEventListener("pagehide", (event) => handleVisibilityChange(event.type === "pagehide"))
        }

        // Start refresh if page is initially visible
        if (document.visibilityState !== "hidden" && okToStartRefresh) {
            startIntervalRefresh();
        }

        addListeners();

        // Cleanup function
        return () => {
            appStateChangeListenerRef.current?.remove();
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
        const rootRoutes = ["/", "/enterurl"];
        
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

export const useInitialLoader = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const {loadInitialTempData, tempDataLoaded} = useContext(TempDataContext);
    const {weatherDataLoaded} = useContext(WeatherContext);
    const {changeInitialThemeComplete} = useContext(SettingsContext);
    const {retrieveAndValidateAPIURL, apiIsHealthy, setAPIIsHealthy, initialAPICheckComplete, setInitialAPICheckComplete } = useContext(APIContext);
    const initialAPICheckAttempted = useRef(false);
    const initialLoadAttempted = useRef(false);
    const fontsLoaded = useFontLoader();
    const showLoadingIcon = useRef(false);
    useBackButtonHandler();

    const readyToNav = (tempDataLoaded && weatherDataLoaded && changeInitialThemeComplete && fontsLoaded);

    // when initially loaded, get URL from preferences/environment 
    useEffect(() => {
        const checkURL = async() => {
            if (initialAPICheckAttempted.current) {
                console.log("Already attempted initial API Check. staying on page");
                return;
            }
            initialAPICheckAttempted.current = true;
            retrieveAndValidateAPIURL();
        }
        if (!demoMode) {
            checkURL();
        } else {
            setInitialAPICheckComplete(true);
            setAPIIsHealthy(true);
        }
    }, [retrieveAndValidateAPIURL, setAPIIsHealthy, setInitialAPICheckComplete])

    // if isAPIHealthy is still false and initialAPICheck is complete, navigate to url entry page
    useEffect(() => {
        if (initialAPICheckComplete && !apiIsHealthy) {
            initialAPICheckAttempted.current = false;
            initialLoadAttempted.current = false;
            navigate("/enterurl", {replace: true, viewTransition: true});
        }
    }, [initialAPICheckComplete, setInitialAPICheckComplete, apiIsHealthy, navigate])

    // if API is healthy and good, then attempt to load initial data from backend API
    useEffect(() => {
        const loadAndNav = async() => {
            if (initialLoadAttempted.current) {
                return;
            }
            initialLoadAttempted.current = true;
            console.log("loading initial temp data");
            await loadInitialTempData();
        }
        if (apiIsHealthy && initialAPICheckComplete) {
            loadAndNav();
        }
    }, [navigate, location, loadInitialTempData, apiIsHealthy,initialAPICheckComplete]);

    useEffect(() => {
        if (readyToNav) {
            if (location.pathname === "/") {
                navigate("/app", {replace: true});
            } else {
                console.log("data loaded, not on root, stay on page");
            }
        }
    }, [readyToNav, location.pathname, navigate]);

    useEffect(() => {
        const timer = setTimeout(() => {
            showLoadingIcon.current = false;
        }, 200);

        return (() => {
            clearTimeout(timer);
        });
    }, []);

    return {showLoading: !(readyToNav || (!apiIsHealthy && initialAPICheckComplete && fontsLoaded && changeInitialThemeComplete))}
}

