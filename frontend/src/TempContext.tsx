import { createContext, useState, useRef } from "react";
import { type TempData, initTempData, demoTempData, HvacStatus } from "./types";
import { demoMode, responseWaitTime } from "./utils";

export interface TempContextType {
    tempData: TempData,
    setTempData: React.Dispatch<React.SetStateAction<TempData>>,
    fetchTempData: () => Promise<void>,
    setHeatCelsius: (newHeatCelsius: number | null) => void,
    setCoolCelsius: (newCoolCelsius: number | null) => void
}
export const initTempContext: TempContextType = {
    tempData: initTempData,
    setTempData: prevState => (prevState),
    fetchTempData: async () => {},
    setHeatCelsius: async () => {},
    setCoolCelsius: async () => {},}

export const TempDataContext = createContext(initTempContext);

type TempDataProviderProps = {
    children: React.ReactNode;
}

export const TempDataProvider: React.FC<TempDataProviderProps> = (props: TempDataProviderProps) => {
    const [tempData, setTempData] = useState<TempData>(initTempData);
    // one shared timer for getting data after setting it
    const getDataTimeoutRef = useRef<number | null>(null);

    async function fetchTempData() {
        // DEMO DATA
        // -- change to only set initially?
        if (demoMode) {
            setTempData(demoTempData);
            console.log("got demo data");
            return;
        }
        // REAL DATA
        console.log("got real data");
        // console.log("Fetching temp data from API");
        // let url = "/api/info";
        // try {
        //     const response = await fetch(url, {
        //         method: "GET",
        //         headers: {
        //             "Content-Type": "application/json"
        //         }
        //     });
        //     if (!response.ok) {
        //         return;
        //     }
        //     const data = await response.json();
        //     console.log("Temp data info successfully:", data);
        //     if (data) {
        //         setTempData(data);
        //     } else {
        //         console.error("Invalid temp data format:", data);
        //     }
        // } catch (error) {
        //     console.error("Error fetching temp data info:", error);
        // }
    }

    async function setHeatCelsius(newHeatCelsius: number | null) {
        if (newHeatCelsius === null) {
            return;
        };
        if (demoMode) {
            setTempData(prevState => ({...prevState, heatCelsius : newHeatCelsius}));
            if (newHeatCelsius !== null && tempData.ambientTempCelsius !== null) {
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
            // Set timer to call fetchTempData
            if (getDataTimeoutRef.current) {
                clearTimeout(getDataTimeoutRef.current);
            }
            getDataTimeoutRef.current = setTimeout(() => {
                fetchTempData();
                console.log("refreshed tempData");
            }, responseWaitTime);
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
            if (newCoolCelsius !== null && tempData.ambientTempCelsius !== null) {
                // give a 0.5C degree buffer before hvac
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
                heatCelsius: newCoolCelsius
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
            // Set timer to call fetchTempData
            if (getDataTimeoutRef.current) {
                clearTimeout(getDataTimeoutRef.current);
            }
            getDataTimeoutRef.current = setTimeout(() => {
                fetchTempData();
                console.log("refreshed tempData");
            }, responseWaitTime);
        } catch (error) {
            console.error("Error setting coolpoint:", error);
        }
    }

    let value: TempContextType = {tempData, setTempData, fetchTempData, setHeatCelsius, setCoolCelsius};

    return (
        <TempDataContext.Provider value={value}>{props.children}</TempDataContext.Provider>
    );
}