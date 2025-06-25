import { parentPort, workerData } from "worker_threads";
import { MessageTypes, ThreadData, ThreadDataResponseMessage, ThreadRequestDataMessage } from "./backendtypes";
import { Sender } from "@questdb/nodejs-client";
import { tempDataInfo } from "./googlesdm";
import { TempData } from "./types";

const logIntervalSeconds = 30;


if (!workerData) {
    console.error("No worker data received...");
}

let {dbClientConf} = workerData;

let sender: Sender|null = null;

async function initializeDB() {
    console.log("initializing DB, opening");
    console.log("passed DB conf is: ",dbClientConf);
    sender = Sender.fromConfig(dbClientConf);
}

// export type TempData = {
//     deviceID: string | null,
//     tempUnits: TempUnits,
//     ambientTempCelsius: number | null,
//     heatCelsius: number | null,
//     coolCelsius: number | null,
//     tempMode: TempMode,
//     hvacStatus: HvacStatus,
//     ecoMode: EcoMode,
//     ecoHeatCelsius: number | null,
//     ecoCoolCelsius: number | null,
//     fanTimer: string | null
//     connectivity: Connectivity,
//     deviceName: string | null
//     ambientHumidity: number | null
// }
function getSimplifiedTempData(tempData: TempData) {
    const returnTempData: TempData = tempData;
    if (returnTempData.deviceID === null) {returnTempData.deviceID = ""};
    if (returnTempData.ambientTempCelsius === null) {returnTempData.ambientTempCelsius = 0};
    if (returnTempData.heatCelsius === null) {returnTempData.heatCelsius = 0};
    if (returnTempData.coolCelsius === null) {returnTempData.coolCelsius = 0};
    return returnTempData;
}

async function logEntryToDB(data: ThreadData) {
    console.log("Logging entry to database...");
    if (!sender) {return};
    for (const logTempData of tempDataInfo) {
        const logData = getSimplifiedTempData(logTempData);
        sender.table("temp")
            .symbol("deviceID",logData.deviceID!)
            .symbol("tempUnits",logData.tempUnits)
            .floatColumn("ambientTempCelsius", logTempData.ambientTempCelsius!);
    }
}

const logInterval = setInterval( async () => {
    if (parentPort) {
        let message: ThreadRequestDataMessage = {type: MessageTypes.requestData};
        parentPort.postMessage(message);
    }
}, logIntervalSeconds*1000);

if (parentPort) {
    parentPort.on("message", async (message: ThreadDataResponseMessage) => {
        if (message.type === MessageTypes.dataResponse) {
            const logData: ThreadData = message.data;
            await logEntryToDB(logData);
        } else if (message.type === MessageTypes.shutdown) {
            clearInterval(logInterval);
            process.exit(0);
        }

    })
}

process.on('SIGTERM', () => {
    console.log("Received terminate message on worker thread. Ending.");
    clearInterval(logInterval);
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log("Received interrupt Ctrl-C on worker thread. Stopping.");
    clearInterval(logInterval);
    process.exit(0);
});

initializeDB();