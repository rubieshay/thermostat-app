import { createContext, useState } from "react";
import { type TempData, initTempData } from "./types";

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

    async function fetchTempData() {
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
        if (newHeatCelsius === null) {return};
        // console.log("Setting heat celsius to " + newHeatCelsius);
        // MAKE API call here
        setTempData(prevState => ({...prevState, heatCelsius : newHeatCelsius}));
    }

    async function setCoolCelsius(newCoolCelsius: number | null) {
        if (newCoolCelsius === null) {return};
        // console.log("Setting cool celsius to " + newCoolCelsius);
        // MAKE API call here
        setTempData(prevState => ({...prevState, coolCelsius : newCoolCelsius}));
    }

    let value: TempContextType = {tempData, setTempData, fetchTempData, setHeatCelsius, setCoolCelsius};

    return (
        <TempDataContext.Provider value={value}>{props.children}</TempDataContext.Provider>
    );
}