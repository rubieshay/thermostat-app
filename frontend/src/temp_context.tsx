import { createContext, useState, useRef, useEffect, useCallback, useMemo} from "react";
import { type TempData, type TempDataArray, type FetchReturn, 
    type LastAPIError, initLastAPIError, noLastAPIError, initTempData, demoTempDataArray, HvacStatus, TempMode, EcoMode, demoSetPointDefaults } from "./types";
import { type SetHeatBody, type SetCoolBody, type SetRangeBody, type SetTempModeBody, type SetEcoModeBody } from "./schemas";
import { demoMode, debounceTime, defaultAPIURL, type ChildrenProviderProps } from "./utils";


export interface TempContextType {
    tempDataArray: TempData[];
    fetchTempData: () => Promise<FetchReturn>,
    selectedTempData: TempData,
    initialLoadComplete: boolean,
    lastAPIError: LastAPIError,
    clearAPIError: () => void,
    debounceTempData: (calledFunction: Function) => void,
    selectedDeviceID: string | null,
    changeDeviceID: (newDeviceID: string) => void,
    setHeatCelsius: (newHeatCelsius: number) => void,
    setCoolCelsius: (newCoolCelsius: number) => void,
    setRangeCelsius: (newHeatCelsius: number, newCoolCelsius: number) => void,
    setTempMode: (newTempMode: TempMode) => void,
    setEcoMode: (newEcoMode: EcoMode) => void,
    startRefreshTimer: () => void,
    stopRefreshTimer: () => void
}
export const initTempContext: TempContextType = {
    tempDataArray: [],
    fetchTempData: async () => {return {success: false}},
    selectedTempData: structuredClone(initTempData),
    initialLoadComplete: false,
    lastAPIError: structuredClone(noLastAPIError),
    clearAPIError: () => {},
    debounceTempData: () => {},
    selectedDeviceID: null,
    changeDeviceID: () => {},
    setHeatCelsius: async () => {},
    setCoolCelsius: async () => {},
    setRangeCelsius: async () => {},
    setTempMode: async () => {},
    setEcoMode: async () => {},
    startRefreshTimer: () => {},
    stopRefreshTimer: () => {}
}

export const TempDataContext = createContext(initTempContext);

export const TempDataProvider: React.FC<ChildrenProviderProps> = (props: ChildrenProviderProps) => {
    const [tempDataArray, setTempDataArray] = useState<TempDataArray>([structuredClone(initTempData)]);
    const [selectedDeviceID, setSelectedDeviceID] = useState<string | null>(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState<boolean>(false);
    const [lastAPIError, setLastAPIError] = useState<LastAPIError>(noLastAPIError);
    const hasFetchedInitial = useRef<boolean>(false);
    const debounceTimer = useRef<number | null>(null);

    useEffect( () => {
        if (hasFetchedInitial.current) {
            return;
        }
        const fetchData = async () => {
            hasFetchedInitial.current = true;
            let fetchReturn = await fetchTempData();
            if (fetchReturn.success) {
                setInitialLoadComplete(true);
            }
        }
        fetchData();
    }, []);

    useEffect ( () => {
        console.log("TempDataArray changed: ",structuredClone(tempDataArray));
    },[tempDataArray[0].deviceID])

    useEffect( () => {
        console.log("Initial Load Complete changed to:", initialLoadComplete);
    },[initialLoadComplete])

    async function fetchTempData(): Promise<FetchReturn> {
        console.log("in FetchTempData...");
        let fetchError: LastAPIError = structuredClone(initLastAPIError);
        fetchError.errorSeq = lastAPIError.errorSeq + 1;
        // DEMO DATA
        if (demoMode) {
            setTempDataArray(structuredClone(demoTempDataArray));
            if (selectedDeviceID === null) {
                setSelectedDeviceID(demoTempDataArray[0].deviceID);
            }
            console.log("got demo data");
            fetchError.fetchReturn.success = true;
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
                return fetchError.fetchReturn;
            }
            const data = await response.json();
            console.log("Got temp data successfully:", data);
            if (data) {
                setTempDataArray(data);
                if (selectedDeviceID === null) {
                    setSelectedDeviceID(data[0].deviceID);
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
        return fetchError.fetchReturn;
    }

    async function refreshTempData () {
        if (demoMode) {
            return;
        }
        fetchTempData();
        console.log("refreshed tempData");
    }

    async function changeDeviceID(selectedDeviceID: string) {
        setSelectedDeviceID(selectedDeviceID);
    }

    function getSelectedTempData(): TempData {
        if (selectedDeviceID === null) {
            return structuredClone(initTempData);
        }
        let selectedTempData = tempDataArray.find((item) => (item.deviceID === selectedDeviceID));
        if (selectedTempData) {
            return selectedTempData;
        } else {
            return structuredClone(initTempData);
        }
    }

    function debounceTempData(cbFunction: Function) {
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }
        debounceTimer.current = window.setTimeout(() => {
            cbFunction();
        }, debounceTime);
    }

    const startRefreshTimer = useCallback( ()=> {
        console.log("Starting refresh timer...")
    },[])

    const stopRefreshTimer = useCallback( ()=> {
        console.log("Stopping refresh timer...")
    },[])

    // SETTING DATA FUNCTIONS

    async function setHeatCelsius(newHeatCelsius: number) {
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
        let fetchError: LastAPIError = structuredClone(initLastAPIError);
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
    }

    async function setCoolCelsius(newCoolCelsius: number) {
        if (newCoolCelsius === null || selectedDeviceID === null) {
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
                        item));
                } else if (newCoolCelsius > selectedTempData.ambientTempCelsius + 0.5) {
                    setTempDataArray((prevState: TempDataArray) => 
                        prevState.map(item => item.deviceID === selectedDeviceID ?
                        { ...item, hvacStatus: HvacStatus.off } :
                        item));
                }
            }
            console.log("set demo coolpoint");
            return;
        }
        
        const url = defaultAPIURL + "/set_cool";
        let fetchError: LastAPIError = structuredClone(initLastAPIError);
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
    }

    async function setRangeCelsius(newHeatCelsius: number | null, newCoolCelsius: number | null) {
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
                        item));
                } else if (newHeatCelsius > selectedTempData.ambientTempCelsius + 0.5) {
                    setTempDataArray((prevState: TempDataArray) => 
                        prevState.map(item => item.deviceID === selectedDeviceID ?
                        { ...item, hvacStatus: HvacStatus.heating } :
                        item));
                } else if (newCoolCelsius > selectedTempData.ambientTempCelsius + 0.5 ||
                    newHeatCelsius < selectedTempData.ambientTempCelsius - 0.5) {
                    setTempDataArray((prevState: TempDataArray) => 
                        prevState.map(item => item.deviceID === selectedDeviceID ?
                        { ...item, hvacStatus: HvacStatus.off } :
                        item));
                }
            }
            console.log("set demo range");
            return;
        }
        
        const url = defaultAPIURL + "/set_range";
        let fetchError: LastAPIError = structuredClone(initLastAPIError);
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
    }

    async function setTempMode(newTempMode: TempMode) {
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
                { ...item, tempMode: newTempMode, heatCelsius: newHeatCelsius, coolCelsius: newCoolCelsius,
                    hvacStatus: newHvacStatus
                 } :
                item));
            console.log("set demo tempMode");
            return;
        }
        
        const url = defaultAPIURL + "/set_temp_mode";
        let fetchError: LastAPIError = structuredClone(initLastAPIError);
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
    }

    async function setEcoMode(newEcoMode: EcoMode) {
        if (selectedDeviceID === null) {
            return;
        }
        if (demoMode) {
            // let newHeatCelsius = null;
            // let newCoolCelsius = null;
            // if (newTempMode === TempMode.heat || newTempMode === TempMode.heatcool) {
            //     newHeatCelsius = demoSetPointDefaults.heatCelsius;
            // }
            // if (newTempMode === TempMode.cool || newTempMode === TempMode.heatcool) {
            //     newCoolCelsius = demoSetPointDefaults.coolCelsius;
            // }
            // let newHvacStatus = HvacStatus.off;
            // const selectedTempData = getSelectedTempData();
            // if (selectedTempData.ambientTempCelsius !== null) {
            //     // give a 0.5C degree buffer for HVAC depending on mode
            //     if ((newTempMode === TempMode.heat || newTempMode === TempMode.heatcool) && newHeatCelsius !== null
            //         && selectedTempData.ambientTempCelsius - 0.5 < newHeatCelsius) {
            //         newHvacStatus = HvacStatus.heating;
            //     } else if ((newTempMode === TempMode.cool || newTempMode === TempMode.heatcool) && newCoolCelsius !== null
            //         && selectedTempData.ambientTempCelsius - 0.5 > newCoolCelsius) {
            //         newHvacStatus = HvacStatus.cooling;
            //     }
            // }
            // setTempDataArray((prevState: TempDataArray) => 
            //     prevState.map(item => item.deviceID === selectedDeviceID ?
            //     { ...item, tempMode: newTempMode, heatCelsius: newHeatCelsius, coolCelsius: newCoolCelsius,
            //         hvacStatus: newHvacStatus
            //      } :
            //     item));

            setTempDataArray((prevState: TempDataArray) => prevState.map(item => item.deviceID === selectedDeviceID ?
                { ...item, ecoMode: newEcoMode } : item));
            console.log("set demo ecoMode");
            return;
        }
        
        const url = defaultAPIURL + "/set_eco_mode";
        let fetchError: LastAPIError = structuredClone(initLastAPIError);
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
    }

    function clearAPIError() {
        setLastAPIError(structuredClone(noLastAPIError));
    }

    const cbFetchTempData = useCallback(() => fetchTempData(),[]);
    const cbClearAPIError = useCallback(() => clearAPIError(),[]);
    const cbGetSelectedTempData = useCallback(() => getSelectedTempData(),[selectedDeviceID]);
    const cbDebounceTempData = useCallback((cbFunction: Function) => debounceTempData(cbFunction),[debounceTimer]);
    const cbChangeDeviceID = useCallback((selectedDeviceID: string) => changeDeviceID(selectedDeviceID),[]);
    const cbSetHeatCelsius = useCallback((newHeatCelsius: number) => setHeatCelsius(newHeatCelsius),[selectedDeviceID]);
    const cbSetCoolCelsius = useCallback((newCoolCelsius: number) => setCoolCelsius(newCoolCelsius),[selectedDeviceID]);
    const cbSetRangeCelsius = useCallback((newHeatCelsius: number, newCoolCelsius: number) => setRangeCelsius(newHeatCelsius, newCoolCelsius),[selectedDeviceID]);
    const cbSetTempMode = useCallback((tempMode: TempMode) => setTempMode(tempMode),[selectedDeviceID]);
    const cbSetEcoMode = useCallback((ecoMode: EcoMode) => setEcoMode(ecoMode),[selectedDeviceID]);
    
    const selectedTempData = getSelectedTempData();

    const memoedValue: TempContextType = useMemo(() => ({
        tempDataArray, initialLoadComplete, lastAPIError, selectedDeviceID, selectedTempData,
        fetchTempData: cbFetchTempData, 
        clearAPIError : cbClearAPIError,
        getSelectedTempData : cbGetSelectedTempData,
        debounceTempData : cbDebounceTempData, 
        changeDeviceID : cbChangeDeviceID,
        setHeatCelsius : cbSetHeatCelsius,
        setCoolCelsius : cbSetCoolCelsius,
        setRangeCelsius : cbSetRangeCelsius,
        setTempMode : cbSetTempMode,
        setEcoMode: cbSetEcoMode,
        startRefreshTimer: startRefreshTimer,
        stopRefreshTimer: stopRefreshTimer
    }),[tempDataArray,initialLoadComplete,lastAPIError,selectedDeviceID])

    return (
        <TempDataContext.Provider value={memoedValue}>{props.children}</TempDataContext.Provider>
    );
}