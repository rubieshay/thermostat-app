import { parentPort, workerData } from "worker_threads";
import { MessageTypes, ThreadData, ThreadDataResponseMessage, ThreadRequestDataMessage } from "./backendtypes";
import { Sender } from "@questdb/nodejs-client";
import { FanMode, HvacStatus, TempData } from "./types";
import log from "./logger";

const logIntervalSeconds = 60;

let dbOK = true;

if (!workerData) {
    log.error("No worker data received...");
}

let {dbClientConf} = workerData;

let sender: Sender|null|any = null;

async function initializeDB() {
    log.debug("initializing DB, opening");
    log.debug("passed DB conf is: ",dbClientConf);
    try {
        sender = Sender.fromConfig(dbClientConf);
    } catch(error) {
        log.error("Could not initializeDB");
        dbOK = false;
    }
    // log.trace("QuestDB config is:",sender);
}

function getSimplifiedTempData(tempData: TempData) {
    const returnTempData: TempData = structuredClone(tempData);
    if (returnTempData.deviceID === null) {returnTempData.deviceID = ""};
    if (returnTempData.ambientTempCelsius === null) {returnTempData.ambientTempCelsius = 0};
    if (returnTempData.heatCelsius === null) {returnTempData.heatCelsius = 0};
    if (returnTempData.coolCelsius === null) {returnTempData.coolCelsius = 0};
    if (returnTempData.ecoHeatCelsius === null) {returnTempData.ecoHeatCelsius = 0};
    if (returnTempData.ecoCoolCelsius === null) {returnTempData.ecoCoolCelsius = 0};
    if (returnTempData.fanTimer === null) {
        const now = new Date();
        returnTempData.fanTimer = now.toUTCString();
    };
    if (returnTempData.deviceName === null) {returnTempData.deviceName = "Thermostat"};
    if (returnTempData.ambientHumidity == null) {returnTempData.ambientHumidity = 0};
    return returnTempData;
}

function getSecondsFromDateTime(UTCTimeString: string) : number {
    let UTCDate = new Date(UTCTimeString);
    let now = new Date();
    let millisApart = UTCDate.getTime() - now.getTime();
    let secondsApart = Math.trunc(millisApart / 1000);
    return secondsApart;
}
 
async function logEntryToDB(data: ThreadData) {
    if (!dbOK) {return};
    log.debug("Logging entry to database...");
    if (!sender) {return};
    for (const logTempData of data.tempDataInfo) {
        const logData = getSimplifiedTempData(logTempData);
        let fanSecondsLeft = getSecondsFromDateTime(logData.fanTimer!);
        let fanMode: FanMode = logTempData.fanTimer === null ? FanMode.off : FanMode.on;
        if (logData.hvacStatus !== HvacStatus.off && logTempData.fanTimer === null){
            fanMode = FanMode.auto;
        }
        let outdoorTempCelsius = data.weatherData.currentTemperature === null ? 0 : data.weatherData.currentTemperature;
        let outdoorHumidity = data.weatherData.currentRelativeHumidity === null ? 0 : data.weatherData.currentRelativeHumidity;
        try {
            await sender.table("temp")
                .symbol("deviceID",logData.deviceID!)
                .symbol("tempUnits",logData.tempUnits)
                .symbol("tempMode",logData.tempMode)
                .symbol("hvacStatus", logData.hvacStatus)
                .symbol("fanMode", fanMode)
                .symbol("ecoMode", logData.ecoMode)
                .floatColumn("indoorTempCelsius", logData.ambientTempCelsius!)
                .floatColumn("heatCelsius", logData.heatCelsius!)
                .floatColumn("coolCelsius", logData.coolCelsius!)
                .floatColumn("ecoHeatCelsius", logData.ecoHeatCelsius!)
                .floatColumn("ecoCoolCelsius", logData.ecoCoolCelsius!)
                .intColumn("fanSecondsLeft", fanSecondsLeft)
                .floatColumn("indoorHumdity", logData.ambientHumidity!)
                .floatColumn("outdoorTempCelsius", outdoorTempCelsius)
                .floatColumn("outdoorHumidty", outdoorHumidity)
                .atNow();
            await sender.flush();
        }
        catch (error) {
            log.error("Unable to log to database...",error);
        }
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
        } else if (message.type === MessageTypes.startup) {
            const logData: ThreadData = message.data;
            await logEntryToDB(logData);
        }

    })
}

async function cleanup() {
    log.debug("Cleaning up dblogging worker thread...");
    clearInterval(logInterval);
    if (sender && dbOK) {
        log.debug("Closing out database...");
        await sender.close();
    }
}

process.on('SIGTERM', async () => {
    log.info("Received terminate message on worker thread. Ending.");
    await cleanup();
    process.exit(0);
});

process.on('SIGINT', async () => {
    log.info("Received interrupt Ctrl-C on worker thread. Stopping.");
    await cleanup();
    process.exit(0);
});

initializeDB();