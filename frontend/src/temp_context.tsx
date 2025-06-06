import { createContext, useState } from "react";
import { type TempData, initTempData, demoTempData, HvacStatus, TempMode, demoSetPointDefaults } from "./types";
import { demoMode } from "./utils";

export interface TempContextType {
    tempData: TempData,
    setTempData: React.Dispatch<React.SetStateAction<TempData>>,
    fetchTempData: () => Promise<void>,
    setHeatCelsius: (newHeatCelsius: number | null) => void,
    setCoolCelsius: (newCoolCelsius: number | null) => void,
    setRangeCelsius: (newHeatCelsius: number | null, newCoolCelsius: number | null) => void
    setTempMode: (newTempMode: TempMode) => void
}
export const initTempContext: TempContextType = {
    tempData: initTempData,
    setTempData: prevState => (prevState),
    fetchTempData: async () => {},
    setHeatCelsius: async () => {},
    setCoolCelsius: async () => {},
    setRangeCelsius: async () => {},
    setTempMode: async () => {},
}

export const TempDataContext = createContext(initTempContext);

type TempDataProviderProps = {
    children: React.ReactNode;
}

export const TempDataProvider: React.FC<TempDataProviderProps> = (props: TempDataProviderProps) => {
    const [tempData, setTempData] = useState<TempData>(initTempData);
    // one shared timer for getting data after setting it
    // const getDataTimeoutRef = useRef<number | null>(null);

    async function fetchTempData() {
        // DEMO DATA
        if (demoMode) {
            setTempData(demoTempData);
            console.log("got demo data");
            return;
        }
        // REAL DATA
        console.log("got real data");
        console.log("Fetching temp data from API");
        let url = "/api/info";
        try {
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            });
            if (!response.ok) {
                return;
            }
            const data = await response.json();
            console.log("Temp data info successfully:", data);
            if (data) {
                setTempData(data);
            } else {
                console.error("Invalid temp data format:", data);
            }
        } catch (error) {
            console.error("Error fetching temp data info:", error);
        }
    }

    async function refreshTempData () {
        // if (getDataTimeoutRef.current) {
        //     clearTimeout(getDataTimeoutRef.current);
        // }
        // getDataTimeoutRef.current = setTimeout(() => {
        //     fetchTempData();
        //     console.log("refreshed tempData");
        // }, responseWaitTime);
        fetchTempData();
        console.log("refreshed tempData");
    }

    async function setHeatCelsius(newHeatCelsius: number | null) {
        if (newHeatCelsius === null) {
            return;
        };
        if (demoMode) {
            setTempData(prevState => ({...prevState, heatCelsius : newHeatCelsius}));
            if (tempData.ambientTempCelsius !== null) {
                // give a 1C degree buffer before hvac
                if (newHeatCelsius > tempData.ambientTempCelsius + 0.5) {
                    setTempData(prevState => ({...prevState, hvacStatus : HvacStatus.heating}));
                } else if (newHeatCelsius < tempData.ambientTempCelsius - 0.5) {
                    setTempData(prevState => ({...prevState, hvacStatus : HvacStatus.off}));
                }
            }
            console.log("set demo heatpoint");
            return;
        }
        
        let url = "/api/set_heat";
        try {
            const reqBody = {
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
        if (newCoolCelsius === null) {
            return;
        };
        if (demoMode) {
            setTempData(prevState => ({...prevState, coolCelsius : newCoolCelsius}));
            if (tempData.ambientTempCelsius !== null) {
                // give a 0.5C degree buffer before HVAC changes
                if (newCoolCelsius < tempData.ambientTempCelsius - 0.5) {
                    setTempData(prevState => ({...prevState, hvacStatus : HvacStatus.cooling}));
                } else if (newCoolCelsius > tempData.ambientTempCelsius + 0.5) {
                    setTempData(prevState => ({...prevState, hvacStatus : HvacStatus.off}));
                }
            }
            console.log("set demo coolpoint");
            return;
        }
        
        let url = "/api/set_cool";
        try {
            const reqBody = {
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
        if (newHeatCelsius === null || newCoolCelsius === null) {
            return;
        };
        if (demoMode) {
            setTempData(prevState => ({...prevState, heatCelsius : newHeatCelsius, coolCesius: newCoolCelsius}));
            if (tempData.ambientTempCelsius !== null) {
                // give a 0.5C degree buffer before HVAC changes
                if (newCoolCelsius < tempData.ambientTempCelsius - 0.5) {
                    setTempData(prevState => ({...prevState, hvacStatus : HvacStatus.cooling}));
                } else if (newHeatCelsius > tempData.ambientTempCelsius + 0.5) {
                    setTempData(prevState => ({...prevState, hvacStatus : HvacStatus.heating}));
                } else if (newCoolCelsius > tempData.ambientTempCelsius + 0.5 ||
                    newHeatCelsius < tempData.ambientTempCelsius - 0.5) {
                    setTempData(prevState => ({...prevState, hvacStatus : HvacStatus.off}));
                }
            }
            console.log("set demo range");
            return;
        }
        
        let url = "/api/set_range";
        try {
            const reqBody = {
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
            if (tempData.ambientTempCelsius !== null) {
                // give a 0.5C degree buffer for HVAC depending on mode
                if ((newTempMode === TempMode.heat || newTempMode === TempMode.heatcool) && newHeatCelsius !== null
                    && tempData.ambientTempCelsius - 0.5 < newHeatCelsius) {
                    newHvacStatus = HvacStatus.heating;
                } else if ((newTempMode === TempMode.cool || newTempMode === TempMode.heatcool) && newCoolCelsius !== null
                    && tempData.ambientTempCelsius - 0.5 > newCoolCelsius) {
                    newHvacStatus = HvacStatus.cooling;
                }
            }
            setTempData(prevState => ({...prevState, tempMode : newTempMode, heatCelsius: newHeatCelsius, coolCelsius: newCoolCelsius, hvacStatus: newHvacStatus}));
            console.log("set demo tempMode");
            return;
        }
        
        let url = "/api/set_temp_mode";
        try {
            const reqBody = {
                TempMode: newTempMode,
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

    let value: TempContextType = {tempData, setTempData, fetchTempData, setHeatCelsius, setCoolCelsius, setRangeCelsius, setTempMode};

    return (
        <TempDataContext.Provider value={value}>{props.children}</TempDataContext.Provider>
    );
}