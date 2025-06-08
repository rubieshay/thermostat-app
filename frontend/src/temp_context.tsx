import { createContext, useState, useRef, useEffect, useCallback, useMemo} from "react";
import { type TempData, type TempDataArray, type FetchReturn, type LastAPIError, initLastAPIError, noLastAPIError, initTempData, demoTempDataArray, HvacStatus, TempMode, EcoMode, demoSetPointDefaults, FanTimerMode} from "./types";
import { type SetHeatBody, type SetCoolBody, type SetRangeBody, type SetTempModeBody, type SetEcoModeBody, type SetFanTimerBody } from "./schemas";
import { demoMode, debounceTime, defaultAPIURL, type ChildrenProviderProps, getUTCDatePlusSeconds, arraysEqualIgnoreOrder, sleep, dataRefreshTime } from "./utils";

export interface TempContextType {
    tempDataArray: TempData[];
    fetchTempData: () => Promise<FetchReturn>,
    selectedTempData: TempData,
    debounceTempData: (calledFunction: Function) => void,
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
    setFanTimer: (newFanTimerMode: FanTimerMode, durationSecond?: number) => void
}

export const initTempContext: TempContextType = {
    tempDataArray: [],
    fetchTempData: async () => {return {success: false}},
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
}

export const TempDataContext = createContext(initTempContext);

export const TempDataProvider: React.FC<ChildrenProviderProps> = (props: ChildrenProviderProps) => {
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

    useEffect( () => {
        console.log("Initial Load Complete changed to:", initialLoadComplete);
    }, [initialLoadComplete])

    const fetchTempData = useCallback (async () => {
        console.log("in FetchTempData...");
        const fetchError: LastAPIError = structuredClone(initLastAPIError);
        if (isFetching.current) {
            console.log("Fetch already in progress. Ignoring");
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
            console.log("got demo data");
            fetchError.fetchReturn.success = true;
            isFetching.current = false;
            return(fetchError.fetchReturn);
        }
        // REAL DATA
        const url = defaultAPIURL + "/info";
        try {
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            });
            if (!response.ok) {
                fetchError.fetchReturn.error = "Failed to fetch temp data: " + response.statusText;
                fetchError.fetchReturn.httpCode = response.status;
                fetchError.lastErrorWasFetch = true;
                setLastAPIError(fetchError)
                isFetching.current = false;
                return fetchError.fetchReturn;
            }
            const data = await response.json();
            console.log("Got temp data successfully:", data);
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
            fetchError.fetchReturn.error = "Other error fetiching temp data info";
            setLastAPIError(fetchError);
        }
        isFetching.current = false;
        return fetchError.fetchReturn;
    }, [lastAPIError.errorSeq, selectedDeviceID,tempDataArray])

    useEffect(() => {
        if (hasFetchedInitial.current) {
            console.log("Initial fetch has already occured.. Skipping new request");
            return;
        }
        const fetchData = async () => {
            let retryCount = 0;
            hasFetchedInitial.current = true;
            let fetchReturn: FetchReturn = {success: false}
            while (retryCount < 10 && !initialFetchSuccess.current) {
                fetchReturn = await fetchTempData();
                if (fetchReturn.success) {
                    initialFetchSuccess.current = true;
                    setInitialLoadComplete(true);
                    console.log("Initial load completed successfully");
                } else {
                    console.log("Initial fetch failed on retry count:",retryCount, " pausing 15s");
                    retryCount++;
                    sleep(dataRefreshTime);
                    console.log("Pause finished, doing next retry");
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
                console.log("Initial fetch not successful after 10 retries");
            }

        }
        fetchData();
    }, [fetchTempData]);

    const refreshTempData = useCallback(() => {
        if (demoMode) {
            return;
        }
        fetchTempData();
        console.log("refreshed tempData");
    }, [fetchTempData])

    async function changeDeviceID(selectedDeviceID: string) {
        setSelectedDeviceID(selectedDeviceID);
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
    }, [selectedDeviceID, tempDataArray])

    function debounceTempData(cbFunction: Function) {
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }
        debounceTimer.current = window.setTimeout(() => {
            cbFunction();
        }, debounceTime);
    }

    // REFRESH TIMER
    
    const startRefreshTimer = useCallback(()=> {
        console.log("Starting refresh timer...")
    }, [])

    const stopRefreshTimer = useCallback(()=> {
        console.log("Stopping refresh timer...")
    }, [])

    // ERROR DISPLAY

    const clearAPIError = useCallback(() => {
        setLastAPIError(structuredClone(noLastAPIError));
    }, [])

    // SETTING DATA FUNCTIONS

    const setHeatCelsius = useCallback(async (newHeatCelsius: number) => {
        if (newHeatCelsius === null || selectedDeviceID === null) {
            return;
        };
        if (demoMode) {
            setTempDataArray((prevState: TempDataArray) => 
                prevState.map(item => item.deviceID === selectedDeviceID ?
                { ...item, heatCelsius: newHeatCelsius } :
                item)
            );
            const selectedTempData = getSelectedTempData();
            if (selectedTempData !== null && selectedTempData.ambientTempCelsius !== null) {
                // give a 1C degree buffer before hvac
                if (newHeatCelsius > selectedTempData.ambientTempCelsius! + 0.5) {
                    setTempDataArray((prevState: TempDataArray) => 
                        prevState.map(item => item.deviceID === selectedDeviceID ?
                        { ...item, hvacStatus: HvacStatus.heating } :
                        item)
                    );
                } else if (newHeatCelsius < selectedTempData.ambientTempCelsius - 0.5) {
                    setTempDataArray((prevState: TempDataArray) => 
                        prevState.map(item => item.deviceID === selectedDeviceID ?
                        { ...item, hvacStatus: HvacStatus.off } :
                        item)
                    );
                }
            }
            console.log("set demo heatpoint");
            return;
        }
        
        const url = defaultAPIURL + "/set_heat";
        const fetchError: LastAPIError = structuredClone(initLastAPIError);
        fetchError.errorSeq = lastAPIError.errorSeq + 1;
        try {
            const reqBody: SetHeatBody = {
                deviceID: selectedDeviceID,
                heatCelsius: newHeatCelsius
            };
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(reqBody)
            });
            if (!response.ok) {
                fetchError.fetchReturn.error = "Failed to set heat: " + response.statusText;
                setLastAPIError(fetchError)
                return;
            }
            const data = await response.json();
            console.log("Set heatpoint successfully:", data);
            refreshTempData();
        } catch (error) {
            fetchError.fetchReturn.error = "Error setting heatpoint: " + error;
            setLastAPIError(fetchError)
            console.error("Error setting heatpoint:", error);
        }
    }, [getSelectedTempData, lastAPIError.errorSeq, refreshTempData, selectedDeviceID]);

    const setCoolCelsius = useCallback(async(newCoolCelsius: number) => {
        if (selectedDeviceID === null) {
            return;
        };
        if (demoMode) {
            setTempDataArray((prevState: TempDataArray) => 
                prevState.map(item => item.deviceID === selectedDeviceID ?
                { ...item, coolCelsius: newCoolCelsius } :
                item)
            );
            const selectedTempData = getSelectedTempData();
            if (selectedTempData.ambientTempCelsius !== null) {
                // give a 0.5C degree buffer before HVAC changes
                if (newCoolCelsius < selectedTempData.ambientTempCelsius - 0.5) {
                    setTempDataArray((prevState: TempDataArray) => 
                        prevState.map(item => item.deviceID === selectedDeviceID ?
                        { ...item, hvacStatus: HvacStatus.cooling } :
                        item)
                    );
                } else if (newCoolCelsius > selectedTempData.ambientTempCelsius + 0.5) {
                    setTempDataArray((prevState: TempDataArray) => 
                        prevState.map(item => item.deviceID === selectedDeviceID ?
                        { ...item, hvacStatus: HvacStatus.off } :
                        item)
                    );
                }
            }
            console.log("set demo coolpoint");
            return;
        }
        
        const url = defaultAPIURL + "/set_cool";
        const fetchError: LastAPIError = structuredClone(initLastAPIError);
        fetchError.errorSeq = lastAPIError.errorSeq + 1;
        try {
            const reqBody: SetCoolBody = {
                deviceID: selectedDeviceID,
                coolCelsius: newCoolCelsius
            };
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(reqBody)
            });
            if (!response.ok) {
                fetchError.fetchReturn.error = "Failed to set cool: " + response.statusText;
                fetchError.fetchReturn.httpCode = response.status;
                setLastAPIError(fetchError);
                return;
            }
            const data = await response.json();
            console.log("Set coolpoint successfully:", data);
            refreshTempData();
        } catch (error) {
            fetchError.fetchReturn.error = "Error setting coolpoint: " + error;
            setLastAPIError(fetchError);
            console.error("Error setting coolpoint:", error);
        }
    }, [getSelectedTempData, selectedDeviceID, lastAPIError.errorSeq, refreshTempData]);

    const setRangeCelsius = useCallback(async (newHeatCelsius: number, newCoolCelsius: number) => {
        if (newHeatCelsius === null || newCoolCelsius === null || selectedDeviceID === null) {
            return;
        };
        if (demoMode) {
            setTempDataArray((prevState: TempDataArray) => 
                prevState.map(item => item.deviceID === selectedDeviceID ?
                { ...item, heatCelsius: newHeatCelsius, coolCelsius: newCoolCelsius } :
                item)
            );
            const selectedTempData = getSelectedTempData();
            if (selectedTempData.ambientTempCelsius !== null) {
                // give a 0.5C degree buffer before HVAC changes
                if (newCoolCelsius < selectedTempData.ambientTempCelsius - 0.5) {
                    setTempDataArray((prevState: TempDataArray) => 
                        prevState.map(item => item.deviceID === selectedDeviceID ?
                        { ...item, hvacStatus: HvacStatus.cooling } :
                        item)
                    );
                } else if (newHeatCelsius > selectedTempData.ambientTempCelsius + 0.5) {
                    setTempDataArray((prevState: TempDataArray) => 
                        prevState.map(item => item.deviceID === selectedDeviceID ?
                        { ...item, hvacStatus: HvacStatus.heating } :
                        item)
                    );
                } else if (newCoolCelsius > selectedTempData.ambientTempCelsius + 0.5 ||
                    newHeatCelsius < selectedTempData.ambientTempCelsius - 0.5) {
                    setTempDataArray((prevState: TempDataArray) => 
                        prevState.map(item => item.deviceID === selectedDeviceID ?
                        { ...item, hvacStatus: HvacStatus.off } :
                        item)
                    );
                }
            }
            console.log("set demo range");
            return;
        }
        
        const url = defaultAPIURL + "/set_range";
        const fetchError: LastAPIError = structuredClone(initLastAPIError);
        fetchError.errorSeq = lastAPIError.errorSeq + 1;
        try {
            const reqBody: SetRangeBody = {
                deviceID: selectedDeviceID,
                heatCelsius: newHeatCelsius,
                coolCelsius: newCoolCelsius
            };
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(reqBody)
            });
            if (!response.ok) {
                fetchError.fetchReturn.error = "Failed to set range: " + response.statusText;
                fetchError.fetchReturn.httpCode = response.status;
                setLastAPIError(fetchError);
                return;
            }
            const data = await response.json();
            console.log("Set range successfully:", data);
            refreshTempData();
        } catch (error) {
            fetchError.fetchReturn.error = "Error setting range: " + error;
            setLastAPIError(fetchError);
            console.error("Error setting range:", error);
        }
    },[getSelectedTempData,selectedDeviceID,refreshTempData,lastAPIError.errorSeq]);

    const setTempMode = useCallback(async (newTempMode: TempMode) => {
        if (selectedDeviceID === null) {
            return;
        }
        if (demoMode) {
            // because we aren't getting the real tempData, we need to determine new setpoints
            // these will be based on default setpoints
            let newHeatCelsius = null;
            let newCoolCelsius = null;
            if (newTempMode === TempMode.heat || newTempMode === TempMode.heatcool) {
                newHeatCelsius = demoSetPointDefaults.heatCelsius;
            }
            if (newTempMode === TempMode.cool || newTempMode === TempMode.heatcool) {
                newCoolCelsius = demoSetPointDefaults.coolCelsius;
            }
            let newHvacStatus = HvacStatus.off;
            const selectedTempData = getSelectedTempData();
            if (selectedTempData.ambientTempCelsius !== null) {
                // give a 0.5C degree buffer for HVAC depending on mode
                if ((newTempMode === TempMode.heat || newTempMode === TempMode.heatcool) && newHeatCelsius !== null
                    && selectedTempData.ambientTempCelsius - 0.5 < newHeatCelsius) {
                    newHvacStatus = HvacStatus.heating;
                } else if ((newTempMode === TempMode.cool || newTempMode === TempMode.heatcool) && newCoolCelsius !== null
                    && selectedTempData.ambientTempCelsius - 0.5 > newCoolCelsius) {
                    newHvacStatus = HvacStatus.cooling;
                }
            }
            setTempDataArray((prevState: TempDataArray) => 
                prevState.map(item => item.deviceID === selectedDeviceID ?
                { ...item, tempMode: newTempMode, heatCelsius: newHeatCelsius, coolCelsius: newCoolCelsius, hvacStatus: newHvacStatus} :
                item)
            );
            console.log("set demo tempMode");
            return;
        }
        
        const url = defaultAPIURL + "/set_temp_mode";
        const fetchError: LastAPIError = structuredClone(initLastAPIError);
        fetchError.errorSeq = lastAPIError.errorSeq + 1;
        try {
            const reqBody: SetTempModeBody = {
                deviceID: selectedDeviceID,
                tempMode: newTempMode,
            };
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(reqBody)
            });
            if (!response.ok) {
                fetchError.fetchReturn.error = "Failed to set tempMode: " + response.statusText;
                fetchError.fetchReturn.httpCode = response.status;
                setLastAPIError(fetchError);
                return;
            }
            const data = await response.json();
            console.log("Set tempMode successfully:", data);
            refreshTempData();
        } catch (error) {
            fetchError.fetchReturn.error = "Error setting tempMode: " + error;
            setLastAPIError(fetchError);
            console.error("Error setting tempMode:", error);
        }
    }, [getSelectedTempData ,selectedDeviceID, refreshTempData, lastAPIError.errorSeq]);

    const setEcoMode = useCallback(async (newEcoMode: EcoMode) => {
        if (selectedDeviceID === null) {
            return;
        }
        if (demoMode) {
            let newHvacStatus = HvacStatus.off;
            const selectedTempData = getSelectedTempData();
            if (selectedTempData.ambientTempCelsius !== null) {
                // give a 0.5C degree buffer for HVAC depending on mode
                if ((selectedTempData.tempMode === TempMode.heat || selectedTempData.tempMode === TempMode.heatcool)
                    && selectedTempData.ecoHeatCelsius !== null
                    && selectedTempData.ambientTempCelsius - 0.5 < selectedTempData.ecoHeatCelsius) {
                    newHvacStatus = HvacStatus.heating;
                } else if ((selectedTempData.tempMode === TempMode.cool || selectedTempData.tempMode === TempMode.heatcool)
                    && selectedTempData.ecoCoolCelsius !== null
                    && selectedTempData.ambientTempCelsius - 0.5 > selectedTempData.ecoCoolCelsius) {
                    newHvacStatus = HvacStatus.cooling;
                }
            }

            setTempDataArray((prevState: TempDataArray) =>
                prevState.map(item => item.deviceID === selectedDeviceID ?
                { ...item, hvacStatus: newHvacStatus, ecoMode: newEcoMode } :
                item)
            );
            console.log("set demo ecoMode");
            return;
        }
        
        const url = defaultAPIURL + "/set_eco_mode";
        const fetchError: LastAPIError = structuredClone(initLastAPIError);
        fetchError.errorSeq = lastAPIError.errorSeq + 1;
        try {
            const reqBody: SetEcoModeBody = {
                deviceID: selectedDeviceID,
                ecoMode: newEcoMode,
            };
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(reqBody)
            });
            if (!response.ok) {
                fetchError.fetchReturn.error = "Failed to set ecoMode: " + response.statusText;
                fetchError.fetchReturn.httpCode = response.status;
                setLastAPIError(fetchError);
                console.log("Failed to set ecoMode:", fetchError.fetchReturn.error);
                return;
            }
            const data = await response.json();
            console.log("Set ecoMode successfully:", data);
            refreshTempData();
        } catch (error) {
            fetchError.fetchReturn.error = "Error setting ecoMode: " + error;
            setLastAPIError(fetchError);
            console.error("Error setting ecoMode:", error);
        }
    }, [selectedDeviceID, lastAPIError.errorSeq, getSelectedTempData, refreshTempData]);

    const setFanTimer = useCallback(async (newFanTimerMode: FanTimerMode, durationSeconds?: number) => {
        if (selectedDeviceID === null || (newFanTimerMode === FanTimerMode.on && !durationSeconds)) {
            return;
        };
        if (demoMode) {
            if (newFanTimerMode === FanTimerMode.off) {
                setTempDataArray((prevState: TempDataArray) => 
                    prevState.map(item => item.deviceID === selectedDeviceID ?
                    { ...item, fanTimer: null } :
                    item)
                );
            } else {
                const isoDate = getUTCDatePlusSeconds(durationSeconds!).toISOString();
                setTempDataArray((prevState: TempDataArray) => 
                    prevState.map(item => item.deviceID === selectedDeviceID ?
                    { ...item, fanTimer: isoDate } :
                    item)
                );
            }
            console.log("set demo fan");
            return;
        }
        
        const url = defaultAPIURL + "/set_fan_timer";
        const fetchError: LastAPIError = structuredClone(initLastAPIError);
        fetchError.errorSeq = lastAPIError.errorSeq + 1;
        try {

            const reqBody: SetFanTimerBody = {
                deviceID: selectedDeviceID,
                timerMode: newFanTimerMode
            };
            if (newFanTimerMode === FanTimerMode.on) {
                reqBody.durationSeconds = durationSeconds!;
            }
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(reqBody)
            });
            if (!response.ok) {
                fetchError.fetchReturn.error = "Failed to set fan timer: " + response.statusText;
                fetchError.fetchReturn.httpCode = response.status;
                setLastAPIError(fetchError);
                return;
            }
            const data = await response.json();
            console.log("Set fan timer successfully:", data);
            refreshTempData();
        } catch (error) {
            fetchError.fetchReturn.error = "Error setting fan timer: " + error;
            setLastAPIError(fetchError);
            console.error("Error setting fan timer:", error);
        }
    }, [selectedDeviceID, refreshTempData, lastAPIError.errorSeq]);

    // SETTING CONTEXT

    const cbDebounceTempData = useCallback((cbFunction: Function) => debounceTempData(cbFunction),[]);
    const cbChangeDeviceID = useCallback((selectedDeviceID: string) => changeDeviceID(selectedDeviceID),[]);
    
    const selectedTempData = getSelectedTempData();

    const memoedValue: TempContextType = useMemo(() => ({
        tempDataArray, fetchTempData, selectedTempData, getSelectedTempData, 
        debounceTempData : cbDebounceTempData, selectedDeviceID, changeDeviceID : cbChangeDeviceID,
        initialLoadComplete, okToStartRefreshTimer,
        startRefreshTimer, stopRefreshTimer, lastAPIError, clearAPIError,
        setHeatCelsius, setCoolCelsius, setRangeCelsius, setTempMode, setEcoMode, setFanTimer
    }), [tempDataArray, fetchTempData, selectedTempData, getSelectedTempData, cbDebounceTempData, selectedDeviceID, cbChangeDeviceID, initialLoadComplete, okToStartRefreshTimer, startRefreshTimer, stopRefreshTimer, lastAPIError, clearAPIError, setHeatCelsius, setCoolCelsius, setRangeCelsius, setTempMode, setEcoMode, setFanTimer]);

    return (
        <TempDataContext.Provider value={memoedValue}>{props.children}</TempDataContext.Provider>
    );
}