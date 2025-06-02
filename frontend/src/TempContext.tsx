import { createContext, useState } from "react";
import * as utils from "./utils";

export type TempDataType = {
    tempUnits: utils.TempUnits,
    ambientTempCelsius: number | null,
    heatCelsius: number | null,
    coolCelsius: number | null,
    tempMode: utils.TempMode,
    hvacStatus: utils.HvacStatus,
    ecoMode: utils.EcoMode,
    ecoHeatCelsius: number | null,
    ecoCoolCelsius: number | null,
    fanTimer: Date | null
    connectivity: utils.Connectivity,
    deviceName: string | null
    ambientHumidity: number | null
}

export const initTempData: TempDataType = {
    tempUnits: utils.TempUnits.fahrenheit,
    ambientTempCelsius: 19.126007,
    heatCelsius: null,
    coolCelsius: 20,
    tempMode: utils.TempMode.cool,
    hvacStatus: utils.HvacStatus.off,
    ecoMode: utils.EcoMode.off,
    ecoHeatCelsius: 27.777779,
    ecoCoolCelsius: 13.333333,
    fanTimer: null,
    connectivity: utils.Connectivity.online,
    deviceName: "Dining Room Thermostat",
    ambientHumidity: 50
}

// export const initTempData: TempDataType = {
//     tempUnits: utils.TempUnits.celsius,
//     ambientTempCelsius: null,
//     heatCelsius: null,
//     coolCelsius: null,
//     tempMode: utils.TempMode.off,
//     hvacStatus: utils.HvacStatus.off,
//     ecoMode: utils.EcoMode.off,
//     ecoHeatCelsius: null,
//     ecoCoolCelsius: null,
//     fanTimer: null,
//     connectivity: utils.Connectivity.offline,
//     deviceName: null,
//     ambientHumidity: null
// }

export interface TempContextType {
    tempData: TempDataType,
    setTempData: React.Dispatch<React.SetStateAction<TempDataType>>,
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
    const [tempData, setTempData] = useState<TempDataType>(initTempData);

    async function fetchTempData() {
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
            if (data && data.tempData) {
                setTempData(data.tempData);
            } else {
                console.error("Invalid temp data format:", data);
            }
        } catch (error) {
            console.error("Error fetching temp data info:", error);
        }
    }

    async function setHeatCelsius(newHeatCelsius: number | null) {
        if (newHeatCelsius === null) {return};
        console.log("Setting heat celsius to " + newHeatCelsius);
        // MAKE API call here
        setTempData(prevState => ({...prevState, heatCelsius : newHeatCelsius}));
    }

    async function setCoolCelsius(newCoolCelsius: number | null) {
        if (newCoolCelsius === null) {return};
        console.log("Setting cool celsius to " + newCoolCelsius);
        // MAKE API call here
        setTempData(prevState => ({...prevState, coolCelsius : newCoolCelsius}));
    }

    // useEffect(() => {
    //     setTempData((prevState) => ({ ...prevState, tempUnits: utils.TempUnits.fahrenheit }))
    //     console.log("DEFAULT API URL:",utils.DEFAULT_API_URL);
    // }, []);

    // console.log("TempDataProvider: tempData:", tempData);

    let value: TempContextType = {tempData, setTempData, fetchTempData, setHeatCelsius, setCoolCelsius};

    return (
        <TempDataContext.Provider value={value}>{props.children}</TempDataContext.Provider>
    );
}