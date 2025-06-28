import { googleClientSecret, googleRefreshToken, googleClientId, googleProjectId, demoMode, sharedMutex } from "./index";
import { APIParams, CoolParams, EcoModeParams, HeatParams, TempModeParams, RangeParams, FanTimerParams } from "./schemas";
import { Connectivity, FetchReturn, TempMode, HvacStatus, EcoMode,
        TempUnitsName, TempUnits, TempData, initTempData, FanTimerMode, 
        demoTempDataArray,
        TempDataArray} from "./types"; 
import { TempCommands, deviceTypeThermostat, sleep } from "./utils"

export let tempDataInfo: TempDataArray = [];

import { URL } from "url";

let accessToken: string | null = null;
let accessTokenExpireSeconds: number = 0;
let accessTokenExpirationTime: Date | null = null;

const TokenExpireBufferSeconds = 300;

const dataCacheExpireSeconds = 600;
let dataCacheExpirationTime: Date | null = null;

function isAccessTokenExpired(): boolean {
    if (demoMode) {return false};
    if (accessToken === null || accessTokenExpirationTime === null) {
        return true;
    }
    let currDate = new Date();
    if (currDate > accessTokenExpirationTime) {
        return true;
    }
    return false;
}

async function checkAndRenewAccessToken() {
    let fetchReturn: FetchReturn = {success: false};
    if (isAccessTokenExpired()) {
        return await getAccessToken();
    } else {
        fetchReturn.success = true;
        fetchReturn.httpCode = 304;
        return fetchReturn;
    }
} 


export async function getAccessToken() : Promise<FetchReturn> {
    const url = new URL("https://www.googleapis.com/oauth2/v4/token");
    url.searchParams.append("client_id", googleClientId);
    url.searchParams.append("client_secret", googleClientSecret);
    url.searchParams.append("refresh_token", googleRefreshToken);
    url.searchParams.append("grant_type", "refresh_token");
    const fetchReturn: FetchReturn = {success: false}
    try {
        const response = await fetch(url, {
            method: "POST"
        });
        if (!response.ok) {
            fetchReturn.httpCode = response.status;
            fetchReturn.error = "Invalid response for refresh token "+response.status;
            return fetchReturn;
        }
        const data = await response.json(); // Or response.text() for text responses
        fetchReturn.success = true;
        accessToken = data.access_token; // Assuming the response contains an access token
        accessTokenExpireSeconds = data.expires_in; // Assuming the response contains an expiration time in seconds
        accessTokenExpirationTime = (new Date(new Date().getTime() + 1000*(accessTokenExpireSeconds - TokenExpireBufferSeconds)))
        console.debug("New Access Token retrieved, Expiration Date with buffer:" + accessTokenExpirationTime);
    } catch (error) {
        // Handle network errors or errors thrown by the if statement above
        if (error instanceof Error) {
            fetchReturn.error = "Fetch error while getting access token: " + error.message;
        } else {
            fetchReturn.error = "Unknown fetch error while getting access token";
        }
    }
    return fetchReturn;
}

function updateCachedData() {
    dataCacheExpirationTime = (new Date(new Date().getTime() + 1000*(dataCacheExpireSeconds)))  
}

export async function checkAndGetDeviceInfo(forceFlush: boolean) : Promise<FetchReturn> {
    if (forceFlush || dataCacheExpirationTime === null) {
        let fetchReturn = await getExclusiveDeviceInfo();
        updateCachedData();
        console.debug("Set initial cached Data or forced flush of data-- not previously set");
        return fetchReturn;
    }
    // check if cached version is recent enough;
    if ((new Date()) > dataCacheExpirationTime) {
        let fetchReturn = await getExclusiveDeviceInfo();
        updateCachedData();
        console.debug("Cached data not recent enough - refreshing");
        return fetchReturn
    } else {
        let fetchReturn: FetchReturn = {success: true, httpCode: 302}
        return fetchReturn;
    }
}

async function getExclusiveDeviceInfo() : Promise<FetchReturn> {
    // This function is used to get the device info with a mutex lock
    return sharedMutex.runExclusive(async () => {
        return await getDeviceInfo()
    })
}

export async function getDeviceInfo() : Promise<FetchReturn> {
    let accessFetchReturn = await checkAndRenewAccessToken();
    
    if (!accessFetchReturn.success) {
        return accessFetchReturn;
    }
    const urlString = encodeURI("https://smartdevicemanagement.googleapis.com/v1/enterprises/" + encodeURIComponent(googleProjectId) + "/devices");
    const fetchReturn: FetchReturn = {success: false}
    const loadingDelayMs = 2000;

    if (demoMode) {
        fetchReturn.success = true;
        tempDataInfo = structuredClone(demoTempDataArray);
        await sleep(loadingDelayMs);
        return fetchReturn;
    }
    try {
        const request = new Request(urlString);
        request.headers.set("Authorization", "Bearer " + accessToken);
        const response = await fetch(request);
        if (!response.ok) {
            fetchReturn.httpCode = response.status;
            fetchReturn.error = "Error getting device info: " + response.statusText;
            return fetchReturn;
        }
        const data = await response.json();
        if (!data || !data.devices) {
            fetchReturn.error = "No devices found or invalid response format";
            return fetchReturn;
        }
        // Loop over all devices of type Thermostat, derive info and add to tempData array
        tempDataInfo = [];
        data.devices.filter((device: any) => (device.type === deviceTypeThermostat)).forEach((device:any) => {
            let currTempData: TempData = structuredClone(initTempData);
            let thermostatDeviceID: string;
            if (!device) {
                fetchReturn.error = "Device not found";
                return fetchReturn;
            } else {
                // this is a string like enterprises/<<project-id>>/devices/<<deviceName>>
                // so lets search for everything after the last slash
                let deviceUUIDName = device.name as string;
                thermostatDeviceID = deviceUUIDName.substring(deviceUUIDName.lastIndexOf("/")+1);
            }
            currTempData.deviceID = thermostatDeviceID;
            if (!device.traits) {
                fetchReturn.error = "No traits found for the device";
                return fetchReturn;
            }
            if (!device.traits["sdm.devices.traits.Info"]) {
                fetchReturn.error = "Info trait not found";
            } else {
                currTempData.deviceName = device.traits["sdm.devices.traits.Info"].customName || null;
            }
            if (!device.traits["sdm.devices.traits.Humidity"]) {
                fetchReturn.error = "Humidity trait not found";
            } else {
                currTempData.ambientHumidity = device.traits["sdm.devices.traits.Humidity"].ambientHumidityPercent || null;
            }
            if (!device.traits["sdm.devices.traits.Connectivity"]) {
                fetchReturn.error = "Connectivity trait not found";
            } else {
                currTempData.connectivity = device.traits["sdm.devices.traits.Connectivity"].status || Connectivity.offline;
            }
            if (!device.traits["sdm.devices.traits.Fan"]) {
                fetchReturn.error = "Fan trait not found";
            } else {
                if (device.traits["sdm.devices.traits.Fan"].timerMode === FanTimerMode.off) {
                    currTempData.fanTimer = null;
                } else {
                    currTempData.fanTimer = device.traits["sdm.devices.traits.Fan"].timerTimeout;
                }
            }
            if (!device.traits["sdm.devices.traits.ThermostatMode"]) {
                fetchReturn.error = "ThermostatMode trait not found";
            } else {
                currTempData.tempMode = device.traits["sdm.devices.traits.ThermostatMode"].mode || TempMode.off;
            }
            if (!device.traits["sdm.devices.traits.ThermostatEco"]) {
                fetchReturn.error = "ThermostatEco trait not found";
            } else {
                currTempData.ecoMode = device.traits["sdm.devices.traits.ThermostatEco"].mode || EcoMode.off;
                currTempData.ecoHeatCelsius = device.traits["sdm.devices.traits.ThermostatEco"].heatCelsius || null;
                currTempData.ecoCoolCelsius = device.traits["sdm.devices.traits.ThermostatEco"].coolCelsius || null;
            }
            if (!device.traits["sdm.devices.traits.ThermostatHvac"]) {
                fetchReturn.error = "ThermostatHvac trait not found";
            } else {
                currTempData.hvacStatus = device.traits["sdm.devices.traits.ThermostatHvac"].status || HvacStatus.off;
            }
            if (!device.traits["sdm.devices.traits.Settings"]) {
                fetchReturn.error = "Settings trait not found";
            } else {
                let tempUnitsName = device.traits["sdm.devices.traits.Settings"].temperatureScale || TempUnitsName.celsius;
                if (tempUnitsName === TempUnitsName.celsius) {
                    currTempData.tempUnits = TempUnits.celsius;
                } else {
                    currTempData.tempUnits = TempUnits.fahrenheit;
                }
            }
            if (!device.traits["sdm.devices.traits.ThermostatTemperatureSetpoint"]) {
                fetchReturn.error = "ThermostatTemperatureSetpoint trait not found";
            } else {
                currTempData.heatCelsius = device.traits["sdm.devices.traits.ThermostatTemperatureSetpoint"].heatCelsius || null;
                currTempData.coolCelsius = device.traits["sdm.devices.traits.ThermostatTemperatureSetpoint"].coolCelsius || null;
            }
            if (!device.traits["sdm.devices.traits.Temperature"]) {
                fetchReturn.error = "Temperature trait not found";
            } else {
                currTempData.ambientTempCelsius = device.traits["sdm.devices.traits.Temperature"].ambientTemperatureCelsius || null;
            }
            tempDataInfo.push(currTempData);
        });
        fetchReturn.success = true;
        fetchReturn.data = data;
    } catch (error) {
        if (error instanceof Error) {
            fetchReturn.error = "Fetch error while getting device info: " + error.message;
        } else {
            fetchReturn.error = "Unknown fetch error while getting device info";
        }
    }
    return fetchReturn;
}

async function makeGoogleAPICall(url: string, command: TempCommands,params: APIParams, description: string): Promise<FetchReturn> {
    let accessFetchReturn = await checkAndRenewAccessToken();
    if (!accessFetchReturn.success) {return accessFetchReturn;};
    let fetchReturn:FetchReturn = {success: false};
    if (demoMode) { fetchReturn.success = true; return fetchReturn;}
    try {
        const request = new Request(url);
        request.headers.set("Authorization", "Bearer " + accessToken);
        request.headers.set('Content-Type', 'application/json');
        let reqBody = {
            command: command,
            params: params
        }
        const response = await fetch(request,{
            body: JSON.stringify(reqBody),
            method: "POST",
        });
        if (!response.ok) {
            fetchReturn.httpCode = response.status;
            fetchReturn.error = "Error "+ description + " : " + response.statusText;
            return fetchReturn;
        }
        fetchReturn.success = true;
    } catch (error) {
        // Handle network errors or errors thrown by the if statement above
        if (error instanceof Error) {
            fetchReturn.error = "Fetch error while " + description + " : " + error.message;
        } else {
            fetchReturn.error = "Unknown fetch error while " + description;
        }
    }
    return fetchReturn;
}

export async function setHeat(deviceID: string, heatCelsius: number): Promise<FetchReturn> {
    const urlString = encodeURI("https://smartdevicemanagement.googleapis.com/v1/enterprises/"+encodeURIComponent(googleProjectId)+"/devices/"+encodeURIComponent(deviceID)+":executeCommand");
    let params : HeatParams = {
        heatCelsius: heatCelsius
    };
    return await (makeGoogleAPICall(urlString,TempCommands.setHeat, params, "Setting Heat"));
}

export async function setCool(deviceID: string, coolCelsius: number): Promise<FetchReturn> {
    const urlString = encodeURI("https://smartdevicemanagement.googleapis.com/v1/enterprises/"+encodeURIComponent(googleProjectId)+"/devices/"+encodeURIComponent(deviceID)+":executeCommand");
    let params: CoolParams = {
        coolCelsius: coolCelsius
    }
    return await (makeGoogleAPICall(urlString,TempCommands.setCool, params, "Setting Cool"));
}

export async function setRange(deviceID: string, heatCelsius: number, coolCelsius: number): Promise<FetchReturn> {
    const urlString = encodeURI("https://smartdevicemanagement.googleapis.com/v1/enterprises/"+encodeURIComponent(googleProjectId)+"/devices/"+encodeURIComponent(deviceID)+":executeCommand");
    let params: RangeParams = {
        heatCelsius: heatCelsius,
        coolCelsius: coolCelsius
    }
    return await (makeGoogleAPICall(urlString,TempCommands.setRange, params, "Setting Range"));
}

export async function setTempMode(deviceID: string, mode: TempMode): Promise<FetchReturn> {
    const urlString = encodeURI("https://smartdevicemanagement.googleapis.com/v1/enterprises/"+encodeURIComponent(googleProjectId)+"/devices/"+encodeURIComponent(deviceID)+":executeCommand");
    let params: TempModeParams = {
        mode: mode
    }
    return await (makeGoogleAPICall(urlString,TempCommands.setMode, params, "Setting Temp Mode"));
}

export async function setEcoMode(deviceID: string, mode: EcoMode): Promise<FetchReturn> {
    const urlString = encodeURI("https://smartdevicemanagement.googleapis.com/v1/enterprises/"+encodeURIComponent(googleProjectId)+"/devices/"+encodeURIComponent(deviceID)+":executeCommand");
    let params: EcoModeParams = {
        mode: mode
    }
    return await (makeGoogleAPICall(urlString,TempCommands.setEcoMode, params, "Setting Eco Mode"));
}

export async function setFanTimer(deviceID: string, timerMode: FanTimerMode, durationSeconds?: number): Promise<FetchReturn> {
    const urlString = encodeURI("https://smartdevicemanagement.googleapis.com/v1/enterprises/"+encodeURIComponent(googleProjectId)+"/devices/"+encodeURIComponent(deviceID)+":executeCommand");
    let params: FanTimerParams = {
        timerMode: timerMode
    }
    if (durationSeconds) {
        params.duration = durationSeconds.toString()+"s";
    }
    return await (makeGoogleAPICall(urlString,TempCommands.setFan, params, "Setting Fan Timer"));
}

export function updateTempDataInfoFull(tempData: TempData[]) {
    tempDataInfo = structuredClone(tempData);
}