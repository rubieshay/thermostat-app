export enum TempUnits {celsius="CELSIUS", fahrenheit="FAHRENHEIT"};
export enum TempMode {heat="HEAT", cool="COOL", heatcool="HEATCOOL", off="OFF"};
export enum HvacStatus {heating="HEATING", cooling="COOLING", off="OFF"};
export enum EcoMode {on="MANUAL_ECO", off="OFF"};
export enum Connectivity {online="ONLINE", offline="OFFLINE"};
export enum FanMode {on="ON", off="OFF"};

export type TempData = {
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

export const initTempData: TempData = {
    tempUnits: TempUnits.fahrenheit,
    ambientTempCelsius: 20,
    heatCelsius: 17,
    coolCelsius: 23,
    tempMode: TempMode.heatcool,
    hvacStatus: HvacStatus.off,
    ecoMode: EcoMode.off,
    ecoHeatCelsius: null,
    ecoCoolCelsius: null,
    fanTimer: null,
    connectivity: Connectivity.offline,
    deviceName: null,
    ambientHumidity: null
}

export type FetchReturn = {
    success: boolean,
    error?: string,
    data?: any
}