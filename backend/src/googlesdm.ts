import { googleClientSecret, googleRefreshToken, googleClientId, googleProjectId, googleDeviceID } from "./index";
import { Connectivity, FetchReturn, FanMode, TempMode, HvacStatus, EcoMode, TempUnitsName, TempUnits } from "./types"; 

import {tempData} from "./index";

import { URL } from "url";

let accessToken: string | null = null;

let accessTokenExpireSeconds: number = 0;
let accessTokenExpirationTime: Date | null = null;

const TokenExpireBufferSeconds = 300;

async function checkAndRenewAccessToken() {
    let fetchReturn: FetchReturn = {success: false};
    if (accessToken === null || accessTokenExpirationTime === null) {
        fetchReturn = await getAccessToken();
        return fetchReturn;
    }
    let currDate = new Date();
    if (currDate > accessTokenExpirationTime) {
        fetchReturn = await getAccessToken();
        return fetchReturn;
    } 
    // current token is OK.
    fetchReturn.success = true;
    fetchReturn.httpCode = 304;
    return fetchReturn;
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
            // If the response status code is not in the 200-299 range,
            // throw an error with the status code and message
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json(); // Or response.text() for text responses
        fetchReturn.success = true;
        accessToken = data.access_token; // Assuming the response contains an access token
        accessTokenExpireSeconds = data.expires_in; // Assuming the response contains an expiration time in seconds
        accessTokenExpirationTime = (new Date(new Date().getTime() + 1000*(accessTokenExpireSeconds - TokenExpireBufferSeconds)))
        console.log("New Access Token retrieved, Expiration Date with buffer:" + accessTokenExpirationTime);
    } catch (error) {
        // Handle network errors or errors thrown by the if statement above
        if (error instanceof Error) {
            fetchReturn.error = "Fetch error: " + error.message;
        } else {
            fetchReturn.error = "Unknown fetch error";
        }
    }
    return fetchReturn;
}

export async function getDeviceInfo() : Promise<FetchReturn> {
    let accessFetchReturn = await checkAndRenewAccessToken();
    if (!accessFetchReturn.success) {return accessFetchReturn;};
    const urlString = encodeURI("https://smartdevicemanagement.googleapis.com/v1/enterprises/"+encodeURIComponent(googleProjectId)+"/devices");
    const fetchReturn: FetchReturn = {success: false}
    try {
        const request = new Request(urlString);
        request.headers.set("Authorization", "Bearer " + accessToken);
        const response = await fetch(request);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        if (!data || !data.devices) {
            fetchReturn.error = "No devices found or invalid response format";
            return fetchReturn;
        }
        // Assuming the first device is the one we want
        const device = data.devices.find((d: any) => d.name.includes(googleDeviceID));
        if (!device) {
            fetchReturn.error = "Device not found";
            return fetchReturn;
        }
        if (!device.traits) {
            fetchReturn.error = "No traits found for the device";
            return fetchReturn;
        }
        if (!device.traits["sdm.devices.traits.Info"]) {
            fetchReturn.error = "Info trait not found";
        } else {
            tempData.deviceName = device.traits["sdm.devices.traits.Info"].customName || null;
        }
        if (!device.traits["sdm.devices.traits.Humidity"]) {
            fetchReturn.error = "Humidity trait not found";
        } else {
            tempData.ambientHumidity = device.traits["sdm.devices.traits.Humidity"].ambientHumidityPercent || null;
        }
        if (!device.traits["sdm.devices.traits.Connectivity"]) {
            fetchReturn.error = "Connectivity trait not found";
        } else {
            tempData.connectivity = device.traits["sdm.devices.traits.Connectivity"].status || Connectivity.offline;
        }
        if (!device.traits["sdm.devices.traits.Fan"]) {
            fetchReturn.error = "Fan trait not found";
        } else {
            if (device.traits["sdm.devices.traits.Fan"].timerMode === FanMode.off) {
                tempData.fanTimer = null;
            } else {
                tempData.fanTimer = new Date(device.traits["sdm.devices.traits.Fan"].timerTimeout);
            }
        }
        if (!device.traits["sdm.devices.traits.ThermostatMode"]) {
            fetchReturn.error = "ThermostatMode trait not found";
        } else {
            tempData.tempMode = device.traits["sdm.devices.traits.ThermostatMode"].mode || TempMode.off;
        }
        if (!device.traits["sdm.devices.traits.ThermostatEco"]) {
            fetchReturn.error = "ThermostatEco trait not found";
        } else {
            tempData.ecoMode = device.traits["sdm.devices.traits.ThermostatEco"].mode || EcoMode.off;
            tempData.ecoHeatCelsius = device.traits["sdm.devices.traits.ThermostatEco"].heatCelsius || null;
            tempData.ecoCoolCelsius = device.traits["sdm.devices.traits.ThermostatEco"].coolCelsius || null;
        }
        if (!device.traits["sdm.devices.traits.ThermostatHvac"]) {
            fetchReturn.error = "ThermostatHvac trait not found";
        } else {
            tempData.hvacStatus = device.traits["sdm.devices.traits.ThermostatHvac"].status || HvacStatus.off;
        }
        if (!device.traits["sdm.devices.traits.Settings"]) {
            fetchReturn.error = "Settings trait not found";
        } else {
            let tempUnitsName = device.traits["sdm.devices.traits.Settings"].temperatureScale || TempUnitsName.celsius;
            if (tempUnitsName === TempUnitsName.celsius) {
                tempData.tempUnits = TempUnits.celsius;
            } else {
                tempData.tempUnits = TempUnits.fahrenheit;
            }
        }
        if (!device.traits["sdm.devices.traits.ThermostatTemperatureSetpoint"]) {
            fetchReturn.error = "ThermostatTemperatureSetpoint trait not found";
        } else {
            tempData.heatCelsius = device.traits["sdm.devices.traits.ThermostatTemperatureSetpoint"].heatCelsius || null;
            tempData.coolCelsius = device.traits["sdm.devices.traits.ThermostatTemperatureSetpoint"].coolCelsius || null;
        }
        if (!device.traits["sdm.devices.traits.Temperature"]) {
            fetchReturn.error = "Temperature trait not found";
        } else {
            tempData.ambientTempCelsius = device.traits["sdm.devices.traits.Temperature"].ambientTemperatureCelsius || null;
        }
        fetchReturn.success = true;
        fetchReturn.data = data;
    } catch (error) {
        if (error instanceof Error) {
            fetchReturn.error = "Fetch error: " + error.message;
        } else {
            fetchReturn.error = "Unknown fetch error";
        }
    }
    return fetchReturn;
}