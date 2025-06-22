import { type TempDataArray, type TempData, HvacStatus, TempMode, demoSetPointDefaults, EcoMode, FanTimerMode } from "../types";
import { getIsoDatePlusDuration } from "./functions";

export function setDemoHeatCelsius(newHeatCelsius: number, selectedDeviceID: string, selectedTempData: TempData,setTempDataArray: React.Dispatch<React.SetStateAction<TempDataArray>>) {
    setTempDataArray((prevState: TempDataArray) => 
        prevState.map(item => item.deviceID === selectedDeviceID ?
        { ...item, heatCelsius: newHeatCelsius } :
        item)
    );

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
}

export function setDemoCoolCelsius(newCoolCelsius: number, selectedDeviceID: string, selectedTempData: TempData,setTempDataArray: React.Dispatch<React.SetStateAction<TempDataArray>>) {

    setTempDataArray((prevState: TempDataArray) => 
        prevState.map(item => item.deviceID === selectedDeviceID ?
        { ...item, coolCelsius: newCoolCelsius } :
        item)
    );
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
}

export function setDemoRangeCelsius(newHeatCelsius: number, newCoolCelsius: number, selectedDeviceID: string, selectedTempData: TempData, setTempDataArray: React.Dispatch<React.SetStateAction<TempDataArray>>) {

    setTempDataArray((prevState: TempDataArray) => 
        prevState.map(item => item.deviceID === selectedDeviceID ?
        { ...item, heatCelsius: newHeatCelsius, coolCelsius: newCoolCelsius } :
        item)
    );
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
}

export function setDemoTempMode(newTempMode: TempMode, selectedDeviceID: string, selectedTempData: TempData, setTempDataArray: React.Dispatch<React.SetStateAction<TempDataArray>>) {

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
}

export function setDemoEcoMode(newEcoMode: EcoMode, selectedDeviceID: string, selectedTempData: TempData, setTempDataArray: React.Dispatch<React.SetStateAction<TempDataArray>>) {

    let newHvacStatus = HvacStatus.off;
    let newCoolCelsius = null;
    let newHeatCelsius = null;
    if (newEcoMode === EcoMode.on && selectedTempData.tempMode !== TempMode.off) {
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
    } else if (newEcoMode === EcoMode.off && selectedTempData.tempMode !== TempMode.off) {
        if (selectedTempData.tempMode === TempMode.heat || selectedTempData.tempMode === TempMode.heatcool) {
            newHeatCelsius = demoSetPointDefaults.heatCelsius;
        }
        if (selectedTempData.tempMode === TempMode.cool || selectedTempData.tempMode === TempMode.heatcool) {
            newCoolCelsius = demoSetPointDefaults.coolCelsius;
        }
    }

    setTempDataArray((prevState: TempDataArray) =>
        prevState.map(item => item.deviceID === selectedDeviceID ?
        { ...item, ecoMode: newEcoMode, hvacStatus: newHvacStatus, coolCelsius: newCoolCelsius, heatCelsius: newHeatCelsius } :
        item)
    );
}

export function setDemoFanTime(newFanTimerMode: FanTimerMode, durationSeconds: number , selectedDeviceID: string, setTempDataArray: React.Dispatch<React.SetStateAction<TempDataArray>>) {

    if (newFanTimerMode === FanTimerMode.off) {
        setTempDataArray((prevState: TempDataArray) => 
            prevState.map(item => item.deviceID === selectedDeviceID ?
            { ...item, fanTimer: null } :
            item)
        );
    } else {
        const isoDate = getIsoDatePlusDuration(durationSeconds!);
        setTempDataArray((prevState: TempDataArray) => 
            prevState.map(item => item.deviceID === selectedDeviceID ?
            { ...item, fanTimer: isoDate } :
            item)
        );
    }
}