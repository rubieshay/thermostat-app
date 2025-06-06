export enum TempUnits {celsius=0, fahrenheit=1};
export enum TempUnitsName {celsius="CELSIUS", fahrenheit="FAHRENHEIT"};
export enum TempMode {heat="HEAT", cool="COOL", heatcool="HEATCOOL", off="OFF"};
export enum HvacStatus {heating="HEATING", cooling="COOLING", off="OFF"};
export enum EcoMode {on="MANUAL_ECO", off="OFF"};
export enum Connectivity {online="ONLINE", offline="OFFLINE"};
export enum FanMode {on="ON", off="OFF"};

export type TempData = {
    deviceID: string | null,
    tempUnits: TempUnits,
    ambientTempCelsius: number | null,
    heatCelsius: number | null,
    coolCelsius: number | null,
    tempMode: TempMode,
    hvacStatus: HvacStatus,
    ecoMode: EcoMode,
    ecoHeatCelsius: number | null,
    ecoCoolCelsius: number | null,
    fanTimer: Date | null
    connectivity: Connectivity,
    deviceName: string | null
    ambientHumidity: number | null
}

export type TempDataArray = TempData[];

// DEFAULT INIT DATA
export const initTempData: TempData = {
    deviceID: null,
    tempUnits: TempUnits.celsius,
    ambientTempCelsius: null,
    heatCelsius: null,
    coolCelsius: null,
    tempMode: TempMode.off,
    hvacStatus: HvacStatus.off,
    ecoMode: EcoMode.off,
    ecoHeatCelsius: null,
    ecoCoolCelsius: null,
    fanTimer: null,
    connectivity: Connectivity.offline,
    deviceName: null,
    ambientHumidity: null
}

// INIT DATA FOR DEMO MODE
export const demoTempDataArray: TempData[] = [
    {
        deviceID: "DEMO",
        tempUnits: TempUnits.fahrenheit,
        ambientTempCelsius: 20,
        heatCelsius: 18.888889,
        coolCelsius: 22.222222,
        tempMode: TempMode.heatcool,
        hvacStatus: HvacStatus.off,
        ecoMode: EcoMode.off,
        ecoHeatCelsius: 27.777778,
        ecoCoolCelsius: 12.777778,
        fanTimer: null,
        connectivity: Connectivity.online,
        deviceName: "My Demo Thermostat",
        ambientHumidity: 50
    }
];

export type SetPointDefaults = {
    heatCelsius: number,
    coolCelsius: number,
}

export const demoSetPointDefaults: SetPointDefaults = {
    heatCelsius: 18.888889,
    coolCelsius: 22.222222,
}

export type WeatherData = {
    latitude: number,
    longitude: number,
    gridId: string | null,
    observationStationsURL: string | null,
    lastCheckTime: Date | null,
    observationStation: string | null,
    observationURL: string | null,
    forecastURL : string | null,
    currentTemperature: number | null,
    currentRelativeHumidity: number | null,
    currentTextDescription: string | null,
    currentWeatherIconURL: string | null
}

export const initWeatherData: WeatherData = {
    latitude: 41.098946,
    longitude: -81.644569,
    gridId: null,
    observationStationsURL: null,
    lastCheckTime: null,
    observationStation: null,
    observationURL: null,
    forecastURL: null,
    currentTemperature: null,
    currentRelativeHumidity: null,
    currentTextDescription: null,
    currentWeatherIconURL: null
}

export type FetchReturn = {
    success: boolean,
    httpCode?: number,
    error?: string,
    data?: any
}