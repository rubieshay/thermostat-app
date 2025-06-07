import { createContext, useState, useRef, useEffect } from "react";
import { type TempData, type TempDataArray, type FetchReturn, initTempData, demoTempDataArray, HvacStatus, TempMode, EcoMode, demoSetPointDefaults } from "./types";
import { type SetHeatBody, type SetCoolBody, type SetRangeBody, type SetTempModeBody, type SetEcoModeBody } from "./schemas";
import { demoMode, debounceTime, defaultAPIURL } from "./utils";

export interface TempContextType {
    tempDataArray: TempData[];
    fetchTempData: () => Promise<FetchReturn>,
    initialLoadComplete: boolean,
    getSelectedTempData: () => TempData,
    debounceTempData: (calledFunction: Function) => void,
    // debounceTimer: RefObject<number | null>,
    selectedDeviceID: string | null,
    changeDeviceID: (newDeviceID: string) => void,
    setHeatCelsius: (newHeatCelsius: number | null) => void,
    setCoolCelsius: (newCoolCelsius: number | null) => void,
    setRangeCelsius: (newHeatCelsius: number | null, newCoolCelsius: number | null) => void,
    setTempMode: (newTempMode: TempMode) => void,
    setEcoMode: (newEcoMode: EcoMode) => void
}
export const initTempContext: TempContextType = {
    tempDataArray: [],
    fetchTempData: async () => {return {success: false}},
    initialLoadComplete: false,
    getSelectedTempData: () => {return structuredClone(initTempData)},
    debounceTempData: () => {},
    // debounceTimer: createRef(),
    selectedDeviceID: null,
    changeDeviceID: () => {},
    setHeatCelsius: async () => {},
    setCoolCelsius: async () => {},
    setRangeCelsius: async () => {},
    setTempMode: async () => {},
    setEcoMode: async () => {}
}

export const TempDataContext = createContext(initTempContext);

type TempDataProviderProps = {
    children: React.ReactNode;
}

export const TempDataProvider: React.FC<TempDataProviderProps> = (props: TempDataProviderProps) => {
    const [tempDataArray, setTempDataArray] = useState<TempDataArray>([structuredClone(initTempData)]);
    const [selectedDeviceID, setSelectedDeviceID] = useState<string | null>(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState<boolean>(false);
    const hasFetchedInitial = useRef<boolean>(false);
    const debounceTimer = useRef<number | null>(null);
    // one shared timer for getting data after setting it
    // const getDataTimeoutRef = useRef<number | null>(null);

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

    async function fetchTempData(): Promise<FetchReturn> {
        let fetchReturn: FetchReturn = {success: false}
        // DEMO DATA
        if (demoMode) {
            setTempDataArray(structuredClone(demoTempDataArray));
            if (selectedDeviceID === null) {
                setSelectedDeviceID(demoTempDataArray[0].deviceID);
            }
            console.log("got demo data");
            fetchReturn.success = true;
            return fetchReturn;
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
                return fetchReturn;
            }
            const data = await response.json();
            console.log("Got temp data successfully:", data);
            if (data) {
                setTempDataArray(data);
                if (selectedDeviceID === null) {
                    setSelectedDeviceID(data[0].deviceID);
                }
                fetchReturn.success = true;
            } else {
                console.error("Invalid temp data format:", data);
            }
        } catch (error) {
            console.error("Error fetching temp data info:", error);
        }
        return fetchReturn;
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

    function debounceTempData(calledFunction: Function) {
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }
        debounceTimer.current = window.setTimeout(() => {
            calledFunction();
        }, debounceTime);
    }

    // SETTING DATA FUNCTIONS

    async function setHeatCelsius(newHeatCelsius: number | null) {
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
                return;
            }
            const data = await response.json();
            console.log("Set heatpoint successfully:", data);
            refreshTempData();
        } catch (error) {
            console.error("Error setting heatpoint:", error);
        }
    }

    async function setCoolCelsius(newCoolCelsius: number | null) {
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
                return;
            }
            const data = await response.json();
            console.log("Set coolpoint successfully:", data);
            refreshTempData();
        } catch (error) {
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
                return;
            }
            const data = await response.json();
            console.log("Set range successfully:", data);
            refreshTempData();
        } catch (error) {
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
                return;
            }
            const data = await response.json();
            console.log("Set tempMode successfully:", data);
            refreshTempData();
        } catch (error) {
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
                return;
            }
            const data = await response.json();
            console.log("Set ecoMode successfully:", data);
            refreshTempData();
        } catch (error) {
            console.error("Error setting ecoMode:", error);
        }
    }

    const value: TempContextType = {tempDataArray, fetchTempData, initialLoadComplete, getSelectedTempData, debounceTempData, selectedDeviceID, changeDeviceID, setHeatCelsius, setCoolCelsius, setRangeCelsius, setTempMode, setEcoMode};

    return (
        <TempDataContext.Provider value={value}>{props.children}</TempDataContext.Provider>
    );
}