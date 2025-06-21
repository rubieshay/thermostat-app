export enum TempUnits {celsius=0, fahrenheit=1};
export enum TempUnitsName {celsius="CELSIUS", fahrenheit="FAHRENHEIT"};
export enum TempMode {heat="HEAT", cool="COOL", heatcool="HEATCOOL", off="OFF"};
export enum HvacStatus {heating="HEATING", cooling="COOLING", off="OFF"};
export enum EcoMode {on="MANUAL_ECO", off="OFF"};
export enum Connectivity {online="ONLINE", offline="OFFLINE"};
export enum FanTimerMode {on="ON", off="OFF"};
export enum SetPointType {heat="HEAT", cool="COOL"};
export enum ModalDrawerType {tempModeModal="TEMP_MODE_MODAL", ecoModeModal="ECO_MODE_MODAL", fanTimerModal="FAN_TIMER_MODAL"};

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
    fanTimer: string | null
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
        ecoHeatCelsius: 12.777778,
        ecoCoolCelsius: 27.777778,
        fanTimer: null,
        connectivity: Connectivity.online,
        deviceName: "My Demo Thermostat",
        ambientHumidity: 52
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
    gridId: string | null,
    observationStationsURL: string | null,
    lastCheckTime: Date | null,
    observationStation: string | null,
    observationURL: string | null,
    observationCity: string | null,
    forecastURL : string | null,
    currentTemperature: number | null,
    currentRelativeHumidity: number | null,
    currentTextDescription: string | null,
    currentWeatherIconURL: string | null
}

export const initWeatherData: WeatherData = {
    gridId: null,
    observationStationsURL: null,
    lastCheckTime: null,
    observationStation: null,
    observationURL: null,
    observationCity: null,
    forecastURL: null,
    currentTemperature: null,
    currentRelativeHumidity: null,
    currentTextDescription: null,
    currentWeatherIconURL: null
}

export const demoWeatherData: WeatherData = {
    gridId: null,
    observationStationsURL: null,
    lastCheckTime: null,
    observationStation: null,
    observationURL: null,
    observationCity: "Demo City",
    forecastURL: null,
    currentTemperature: 19.4,
    currentRelativeHumidity: 63,
    currentTextDescription: "Mostly Cloudy",
    currentWeatherIconURL: "https://api.weather.gov/icons/land/day/bkn?size=medium"
}

export type FetchReturn = {
    success: boolean,
    httpCode?: number,
    error?: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?: any
}

export type LastAPIError  = {
    fetchReturn: FetchReturn,
    lastErrorWasFetch: boolean;
    errorSeq: number;
}

export const initLastAPIError: LastAPIError = {
    fetchReturn : {success: false},
    lastErrorWasFetch: false,
    errorSeq: 0,
}

export const noLastAPIError: LastAPIError = {
    fetchReturn: {success: true},
    lastErrorWasFetch: false,
    errorSeq: 0
}

export enum TempMessageType {
    tempUpdate = "tempUpdate",
    weatherUpdate = "weatherUpdate",
    errorUpdate = "errorUpdate",
    statusUpdate = "statusUpdate",
}

export type TempUpdateMessage = {
    tempData: TempDataArray,
}

export type WeatherUpdateMessage = {
    weatherData: WeatherData,
}

export type ErrorUpdateMessage = {
    errorMessage: string,
}

export type StatusUpdateMessage = {
    message: string
}

export type TempMessage = {
    type: TempMessageType,
    data: TempUpdateMessage | WeatherUpdateMessage | ErrorUpdateMessage | StatusUpdateMessage
}