import { WeatherData, type TempDataArray } from "./types"

export enum MessageTypes {
    requestData = "REQDATA",
    dataResponse = "DATARESP",
    startup = "START",
    shutdown = "SHUT"
}

export type ThreadRequestDataMessage = {
    type: MessageTypes.requestData,
}

export type ThreadStartupMessage = {
    type: MessageTypes.startup,
    data: ThreadData
}

export type ThreadShutdownMessage = {
    type: MessageTypes.shutdown
}

export type ThreadData = {
    tempDataInfo: TempDataArray,
    weatherData: WeatherData
}

export type ThreadDataResponseMessage = {
    type: MessageTypes.dataResponse,
    data: ThreadData
}