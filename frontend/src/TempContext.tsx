import { createContext, useState, useEffect } from "react";
import * as utils from "./utils";

export type TempDataType = {
    tempUnits: utils.TempUnits,
    ambientTempCelsius: number | null,
    heatCelsius: number | null,
    coolCelsius: number | null,
    tempMode: utils.TempMode,
    hvacStatus: utils.HvacStatus,
    ecoMode: utils.EcoMode,
    fanTimer: Date | null
}
// export const initTempData: TempDataType = {
//     tempUnits: utils.TempUnits.celsius,
//     ambientTempCelsius: null,
//     heatCelsius: null,
//     coolCelsius: null,
//     tempMode: utils.TempMode.off,
//     hvacStatus: utils.TempStatus.off,
//     ecoMode: utils.EcoMode.off,
//     fanTimer: null
// }
export const initTempData: TempDataType = {
    tempUnits: utils.TempUnits.fahrenheit,
    ambientTempCelsius: 20,
    heatCelsius: 17,
    coolCelsius: 23,
    tempMode: utils.TempMode.heatcool,
    hvacStatus: utils.HvacStatus.off,
    ecoMode: utils.EcoMode.off,
    fanTimer: null
}

export interface TempContextType {
    tempData: TempDataType,
    setTempData: React.Dispatch<React.SetStateAction<TempDataType>>,
    setHeatCelsius: (newHeatCelsius: number | null) => void,
    setCoolCelsius: (newCoolCelsius: number | null) => void
}
export const initTempContext: TempContextType = {
    tempData: initTempData,
    setTempData: prevState => (prevState),
    setHeatCelsius: async () => {},
    setCoolCelsius: async () => {},
}

export const TempDataContext = createContext(initTempContext);

type TempDataProviderProps = {
    children: React.ReactNode;
}

export const TempDataProvider: React.FC<TempDataProviderProps> = (props: TempDataProviderProps) => {
    const [tempData, setTempData] = useState<TempDataType>(initTempData);

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

    useEffect(() => {
        setTempData((prevState) => ({ ...prevState, tempUnits: utils.TempUnits.fahrenheit }))
        console.log("DEFAULT API URL:",utils.DEFAULT_API_URL);
    }, []);

    let value: TempContextType = {tempData, setTempData, setHeatCelsius, setCoolCelsius};

    return (
        <TempDataContext.Provider value={value}>{props.children}</TempDataContext.Provider>
    );
}