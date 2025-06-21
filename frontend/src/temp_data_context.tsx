import { createContext, useState, useRef, useCallback, useMemo, useContext} from "react";
import { type TempData, type TempDataArray, type FetchReturn, type LastAPIError, initLastAPIError, noLastAPIError, initTempData, demoTempDataArray, TempMode, EcoMode, FanTimerMode} from "./types";
import { type SetHeatBody, type SetCoolBody, type SetRangeBody, type SetTempModeBody, type SetEcoModeBody, type SetFanTimerBody, type ValidTempBackendBody } from "./schemas";
import { demoMode, debounceTime, type ChildrenProviderProps, arraysEqualIgnoreOrder, sleep, dataRefreshTime } from "./utils";
import { setDemoCoolCelsius, setDemoEcoMode, setDemoFanTime, setDemoHeatCelsius, setDemoRangeCelsius, setDemoTempMode } from "./temp_data_utils";
import { APIContext } from "./api_context";

export interface TempContextType {
    tempDataArray: TempDataArray;
    fetchTempData: (forceFlush: boolean) => Promise<FetchReturn>,
    loadInitialTempData: () => Promise<void>,
    selectedTempData: TempData,
    debounceTempData: (cbFunction: Function, letWait: boolean) => void,
    selectedDeviceID: string | null,
    changeDeviceID: (newDeviceID: string) => void,
    initialLoadComplete: boolean,
    okToStartRefreshTimer: boolean,
    startRefreshTimer: () => void,
    stopRefreshTimer: () => void,
    lastAPIError: LastAPIError,
    clearAPIError: () => void,
    setHeatCelsius: (newHeatCelsius: number) => void,
    setCoolCelsius: (newCoolCelsius: number) => void,
    setRangeCelsius: (newHeatCelsius: number, newCoolCelsius: number) => void,
    setTempMode: (newTempMode: TempMode) => void,
    setEcoMode: (newEcoMode: EcoMode) => void,
    setFanTimer: (newFanTimerMode: FanTimerMode, durationSecond?: number) => void,
    updateAllTempData: (newTempData: TempDataArray) => void
}

export const initTempContext: TempContextType = {
    tempDataArray: [],
    fetchTempData: async () => {return {success: false}},
    loadInitialTempData: async () => {},
    selectedTempData: structuredClone(initTempData),
    debounceTempData: () => {},
    selectedDeviceID: null,
    changeDeviceID: () => {},
    initialLoadComplete: false,
    okToStartRefreshTimer: false,
    startRefreshTimer: () => {},
    stopRefreshTimer: () => {},
    lastAPIError: structuredClone(noLastAPIError),
    clearAPIError: () => {},
    setHeatCelsius: async () => {},
    setCoolCelsius: async () => {},
    setRangeCelsius: async () => {},
    setTempMode: async () => {},
    setEcoMode: async () => {},
    setFanTimer: async () => {},
    updateAllTempData: () => {}
}

export const TempDataContext = createContext(initTempContext);

export const TempDataProvider: React.FC<ChildrenProviderProps> = (props: ChildrenProviderProps) => {
    const {apiURL} = useContext(APIContext); 
    const [tempDataArray, setTempDataArray] = useState<TempDataArray>([structuredClone(initTempData)]);
    const [selectedDeviceID, setSelectedDeviceID] = useState<string | null>(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState<boolean>(false);
    const [okToStartRefreshTimer, setOkToStartRefreshTimer] = useState<boolean>(false); 
    const [lastAPIError, setLastAPIError] = useState<LastAPIError>(noLastAPIError);
    const hasFetchedInitial = useRef<boolean>(false);
    const initialFetchSuccess = useRef<boolean>(false);
    const isFetching = useRef<boolean>(false);
    const debounceTimer = useRef<number | null>(null);
    
    // GETTING/RESETTING TEMP DATA

    const fetchTempData = useCallback (async (forceFlush: boolean) => {
        const fetchError: LastAPIError = structuredClone(initLastAPIError);
        if (isFetching.current) {
            return fetchError.fetchReturn;
        }
        if (demoMode && initialFetchSuccess.current) {
            fetchError.fetchReturn.success = true;
            return fetchError.fetchReturn;
        }
        isFetching.current = true;
        fetchError.errorSeq = lastAPIError.errorSeq + 1;
        // DEMO DATA
        if (demoMode) {
            setTempDataArray(structuredClone(demoTempDataArray));
            if (selectedDeviceID === null) {
                setSelectedDeviceID(demoTempDataArray[0].deviceID);
            }
            fetchError.fetchReturn.success = true;
            isFetching.current = false;
            initialFetchSuccess.current = true;
            return(fetchError.fetchReturn);
        }
        // REAL DATA
        const url = apiURL + "/info";
        try {
            const fetchParams = new URL(url);
            fetchParams.searchParams.append("force_flush", forceFlush.toString());
            const response = await fetch(fetchParams, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            });
            if (!response.ok) {
                fetchError.fetchReturn.error = "Failed to fetch temp data: " + response.statusText;
                fetchError.fetchReturn.httpCode = response.status;
                fetchError.lastErrorWasFetch = true;
                setLastAPIError(fetchError);
                isFetching.current = false;
                return fetchError.fetchReturn;
            }
            const data = await response.json();
            if (data) {
                if (!arraysEqualIgnoreOrder(tempDataArray,data)) {
                    setTempDataArray(data);
                    if (selectedDeviceID === null) {
                        setSelectedDeviceID(data[0].deviceID);
                    }
                }
                fetchError.fetchReturn.success = true;
            } else {
                fetchError.fetchReturn.error = "Invalid temp data format";
                fetchError.fetchReturn.httpCode = 500;
                fetchError.lastErrorWasFetch = true;
                setLastAPIError(fetchError)
                console.error("Invalid temp data format:", data);
            }
        } catch (error) {
            console.error("Error fetching temp data info:", error);
            fetchError.fetchReturn.error = "Other error fetching temp data info";
            setLastAPIError(fetchError);
        }
        isFetching.current = false;
        return fetchError.fetchReturn;
    }, [lastAPIError.errorSeq, selectedDeviceID, tempDataArray, apiURL]);

    const fetchInitialData = useCallback(async () => {
        let retryCount = 0;
        hasFetchedInitial.current = true;
        let fetchReturn: FetchReturn = {success: false}
        while (retryCount < 10 && !initialFetchSuccess.current) {
            fetchReturn = await fetchTempData(true);
            if (fetchReturn.success) {
                initialFetchSuccess.current = true;
                setInitialLoadComplete(true);
                console.debug("Initial load completed successfully");
            } else {
                console.error("Initial fetch failed on retry count:", retryCount, "pausing 15s");
                retryCount++;
                await sleep(dataRefreshTime);
                console.error("Pause finished, doing next retry");
            }
        }
        if (initialFetchSuccess.current) {
            setOkToStartRefreshTimer(true);
        } else {
            const apiError: LastAPIError = initLastAPIError;
            apiError.fetchReturn = fetchReturn;
            apiError.lastErrorWasFetch = true;
            apiError.fetchReturn.success = false;
            apiError.fetchReturn.error = "Initial fetch failed:" + fetchReturn.error;
            setLastAPIError(apiError);
            console.error("Initial fetch not successful after 10 retries");
        }
    },[fetchTempData]);

    const loadInitialTempData = useCallback( async() => {
        if (hasFetchedInitial.current) {
            return;
        }
        await fetchInitialData();
    },[fetchInitialData])

    async function changeDeviceID(selectedDeviceID: string) {
        setSelectedDeviceID(selectedDeviceID);
        // shouldn't this also change selectedTempData?
    }

    const getSelectedTempData = useCallback(() => {
        if (selectedDeviceID === null) {
            return structuredClone(initTempData);
        }
        const selectedTempData = tempDataArray.find((item) => (item.deviceID === selectedDeviceID));
        if (selectedTempData) {
            return selectedTempData;
        } else {
            return structuredClone(initTempData);
        }
    }, [selectedDeviceID, tempDataArray]);

    function debounceTempData(cbFunction: Function, letWait: boolean) {
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }
        if (letWait) {
            debounceTimer.current = window.setTimeout(() => {
                cbFunction();
            }, debounceTime);
        } else {
            cbFunction();
        }
    }

    // REFRESH TIMER
    
    const startRefreshTimer = useCallback(()=> {
        // console.log("Starting refresh timer...");
    }, []);

    const stopRefreshTimer = useCallback(()=> {
        // console.log("Stopping refresh timer...");
    }, []);

    // ERROR DISPLAY

    const clearAPIError = useCallback(() => {
        setLastAPIError(structuredClone(noLastAPIError));
    }, []);

    // SETTING DATA FUNCTIONS

    const makeBackendAPICall = useCallback(async (apiEndpoint: string, reqBody: ValidTempBackendBody, description: string) => {
        const url = apiURL + "/" + apiEndpoint;
        const fetchError: LastAPIError = structuredClone(initLastAPIError);
        fetchError.errorSeq = lastAPIError.errorSeq + 1;
        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(reqBody)
            });
            if (!response.ok) {
                fetchError.fetchReturn.error = "Failed to " + description + " : " + response.statusText;
                fetchError.fetchReturn.httpCode = response.status;
                setLastAPIError(fetchError)
                return;
            }
            // fetchTempData(true); // This should no longer be necessary, as the websocket will update the data
        } catch (error) {
            fetchError.fetchReturn.error = "Error in " + description + " : " + error;
            setLastAPIError(fetchError)
            console.error("Error in " + description + " : " , error);
        }
    }, [lastAPIError.errorSeq, apiURL]);

    const setHeatCelsius = useCallback(async (newHeatCelsius: number) => {
        if (newHeatCelsius === null || selectedDeviceID === null) {
            return;
        };
        if (demoMode) {
            setDemoHeatCelsius(newHeatCelsius, selectedDeviceID, getSelectedTempData(), setTempDataArray);
            return;
        }

        const reqBody: SetHeatBody = {
            deviceID: selectedDeviceID,
            heatCelsius: newHeatCelsius
        };

        await makeBackendAPICall("set_heat", reqBody, "setting heatpoint");
        
    }, [getSelectedTempData, selectedDeviceID, makeBackendAPICall]);

    const setCoolCelsius = useCallback(async(newCoolCelsius: number) => {
        if (selectedDeviceID === null) {
            return;
        };
        if (demoMode) {
            setDemoCoolCelsius(newCoolCelsius, selectedDeviceID, getSelectedTempData(), setTempDataArray);
            return;
        }
        const reqBody: SetCoolBody = {
            deviceID: selectedDeviceID,
            coolCelsius: newCoolCelsius
        };
        
        await makeBackendAPICall("set_cool", reqBody, "setting coolpoint");

    }, [getSelectedTempData, selectedDeviceID, makeBackendAPICall]);

    const setRangeCelsius = useCallback(async (newHeatCelsius: number, newCoolCelsius: number) => {
        if (newHeatCelsius === null || newCoolCelsius === null || selectedDeviceID === null) {
            return;
        };
        if (demoMode) {
            setDemoRangeCelsius(newHeatCelsius, newCoolCelsius, selectedDeviceID, getSelectedTempData(), setTempDataArray);
            return;
        }
        const reqBody: SetRangeBody = {
            deviceID: selectedDeviceID,
            heatCelsius: newHeatCelsius,
            coolCelsius: newCoolCelsius
        };

        makeBackendAPICall("set_range", reqBody, "setting range");

    }, [getSelectedTempData, selectedDeviceID, makeBackendAPICall]);

    const setTempMode = useCallback(async (newTempMode: TempMode) => {
        if (selectedDeviceID === null) {
            return;
        }
        if (demoMode) {
            setDemoTempMode(newTempMode, selectedDeviceID, getSelectedTempData(), setTempDataArray);
            return;
        }
        const reqBody: SetTempModeBody = {
            deviceID: selectedDeviceID,
            tempMode: newTempMode,
        };
        
        makeBackendAPICall("set_temp_mode", reqBody, "setting tempMode");

    }, [getSelectedTempData, selectedDeviceID, makeBackendAPICall]);

    const setEcoMode = useCallback(async (newEcoMode: EcoMode) => {
        if (selectedDeviceID === null) {
            return;
        }
        if (demoMode) {
            setDemoEcoMode(newEcoMode, selectedDeviceID, getSelectedTempData(), setTempDataArray);
            return;
        }
        const reqBody: SetEcoModeBody = {
            deviceID: selectedDeviceID,
            ecoMode: newEcoMode,
        };

        makeBackendAPICall("set_eco_mode", reqBody, "setting ecoMode");
        

    }, [selectedDeviceID, makeBackendAPICall, getSelectedTempData]);

    const setFanTimer = useCallback(async (newFanTimerMode: FanTimerMode, durationSeconds?: number) => {
        if (selectedDeviceID === null || (newFanTimerMode === FanTimerMode.on && !durationSeconds)) {
            return;
        };
        if (demoMode) {
            setDemoFanTime(newFanTimerMode, durationSeconds!, selectedDeviceID, setTempDataArray);
            return;
        }
        const reqBody: SetFanTimerBody = {
            deviceID: selectedDeviceID,
            timerMode: newFanTimerMode,
            durationSeconds: durationSeconds || 0
        };
        makeBackendAPICall("set_fan_timer", reqBody, "setting fan timer");
        
    }, [selectedDeviceID, makeBackendAPICall]);

    function updateAllTempData(newTempDataArray: TempDataArray) {
        setTempDataArray(structuredClone(newTempDataArray));
    }

    // SETTING CONTEXT

    const cbDebounceTempData = useCallback((cbFunction: Function, letWait: boolean) => debounceTempData(cbFunction, letWait), []);
    const cbChangeDeviceID = useCallback((selectedDeviceID: string) => changeDeviceID(selectedDeviceID), []);
    
    const selectedTempData = getSelectedTempData();

    const memoedValue: TempContextType = useMemo(() => ({
        tempDataArray, fetchTempData, loadInitialTempData, selectedTempData, getSelectedTempData, 
        debounceTempData : cbDebounceTempData, selectedDeviceID, changeDeviceID : cbChangeDeviceID,
        initialLoadComplete, okToStartRefreshTimer,
        startRefreshTimer, stopRefreshTimer, lastAPIError, clearAPIError,
        setHeatCelsius, setCoolCelsius, setRangeCelsius, setTempMode, setEcoMode, setFanTimer, updateAllTempData
    }), [tempDataArray, fetchTempData, loadInitialTempData, selectedTempData, getSelectedTempData, cbDebounceTempData, selectedDeviceID, cbChangeDeviceID, initialLoadComplete, okToStartRefreshTimer, startRefreshTimer, stopRefreshTimer, lastAPIError, clearAPIError, setHeatCelsius, setCoolCelsius, setRangeCelsius, setTempMode, setEcoMode, setFanTimer]);

    return (
        <TempDataContext.Provider value={memoedValue}>{props.children}</TempDataContext.Provider>
    );
}