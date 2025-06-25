import Fastify from "fastify";
import cors from '@fastify/cors';
import fastifyWebSockets from "@fastify/websocket";
import { FetchReturn, TempMessageType, WeatherData, initWeatherData, TempMessage } from "./types";
import { infoQuerySchema, InfoQueryString, latLongQuerySchema, latLongQueryString, setHeatSchema, SetHeatBody, 
        setCoolSchema, SetCoolBody, setRangeSchema, SetRangeBody, setTempModeSchema,
        SetTempModeBody, setEcoModeSchema, SetEcoModeBody, setFanTimerSchema, SetFanTimerBody} from "./schemas";
import { checkAndGetDeviceInfo, setHeat, setCool, setRange, setTempMode, setEcoMode, setFanTimer} from "./googlesdm";
import { getCurrentObservation, initializeWeatherAndRefresh } from "./weather";
import {tempDataInfo} from "./googlesdm";
import { getDataAndSubscribe, removeSubscription } from "./googlepubsub";
import { Mutex } from "./mutex";
import { stripSlashFromURLIfThere } from "./utils";
import { Worker } from "worker_threads";
import * as path from "path";
import { MessageTypes, ThreadDataResponseMessage, ThreadRequestDataMessage, ThreadShutdownMessage, ThreadStartupMessage } from "./backendtypes";

export const googleClientId  = process.env.CLIENT_ID || "";
export const googleClientSecret = process.env.CLIENT_SECRET || "";
export const googleProjectId = process.env.PROJECT_ID || "";
export const googleRefreshToken = process.env.REFRESH_TOKEN || "";
export const googleTopicId = process.env.TOPIC_ID || "thermostat-topic-id";
export const googlePubSubProjectId = process.env.PUBSUB_PROJECT_ID || "";
export const demoMode = ( process.env.DEMO_MODE?.toUpperCase() === "1" || process.env.DEMO_MODE?.toUpperCase() === "YES" || process.env.DEMO_MODE?.toUpperCase() === "TRUE") ? true : false;
export const environment = process.env.ENVIRONMENT || "prod";
export const subscriptionId = "thermostat-sub-id-" + environment;
export let weatherLatitude = Number(process.env.WEATHER_LATITUDE) || 39.833333; // Default to Lebanon, KS
export let weatherLongitude = Number(process.env.WEATHER_LONGITUDE) || -98.583333; // Default to Lebanon, KS
export const defaultCORSOrigin = (process.env.DEFAULT_CORS_ORIGIN === null || process.env.DEFAULT_CORS_ORIGIN === undefined) ? null : stripSlashFromURLIfThere(process.env.DEFAULT_CORS_ORIGIN)
const dbLogging = (process.env.DB_LOGGING?.toUpperCase() === "1" || process.env.DB_LOGGING?.toUpperCase() === "YES" || process.env.DB_LOGGING?.toUpperCase() === "TRUE") ? true: false;
const dbClientConf = (process.env.DB_CLIENT_CONF === null || process.env.DB_CLIENT_CONF === undefined) ? "http::addr=localhost:9000" : process.env.DB_CLIENT_CONF;

const httpPort = Number(process.env.PORT) || 3000;

console.log("Environmental Info:",JSON.stringify({demoMode, environment,dbLogging,dbClientConf}));

export let weatherData: WeatherData = structuredClone(initWeatherData);

export const sharedMutex = new Mutex();

export const fastify = Fastify({
    logger: true
})

fastify.register(fastifyWebSockets);

fastify.register(cors, {
    origin: (origin, cb) => {
        if (origin === undefined) {
            cb(null,true);
            return;
        };
        const hostname = new URL(origin).hostname
        if(hostname === "localhost" || (defaultCORSOrigin !== null && origin.includes(defaultCORSOrigin))){
            //  Request from localhost or defaultCORSOrigin will pass
            cb(null, true);
            return;
        }
        // Generate an error on other origins, disabling access
        cb(new Error("Not allowed"), false)
    }
})

fastify.register( async function (fastify) {
    fastify.get("/ws", { websocket: true,},
        (socket, req) => {
            // TODO : initial connect action -- start regular thermostat polling
            console.debug("Initial WS Connect");
            let statusMessage: TempMessage = { type: TempMessageType.statusUpdate, data: { message: "Connected to Fastify WebSocket" } };
            socket.send(JSON.stringify(statusMessage));
            socket.on("message", (msg: string) => {
                console.error("Received message from client, no actions possible: :",msg)
            });
            socket.on("close", () => {
                console.debug("WS closed by client");
                //TODO : stop regular thermostat polling
            })
        }
    );
});

fastify.get("/healthz", async (request, reply) => {
    reply.status(200).send({ status: "OK"});
})

fastify.get<{ Querystring: InfoQueryString }>("/info", {schema: {querystring: infoQuerySchema}}, async (request, reply) => {
    const {force_flush} = request.query;
    let fetchReturn: FetchReturn;
    fetchReturn = await checkAndGetDeviceInfo(force_flush);
    if (!fetchReturn.success) {
        console.error("Got an error in getDeviceInfo:", fetchReturn.error);
        if (!fetchReturn.httpCode) {fetchReturn.httpCode = 500;}
        return reply.status(fetchReturn.httpCode).send({ error: fetchReturn.error || "Failed to get device info" });
    }
    reply.send(tempDataInfo);
});

fastify.get("/weather", async (request, reply) => {
    let fetchReturn: FetchReturn;
    fetchReturn = await getCurrentObservation();
    if (!fetchReturn.success) {
        console.error("Got an error in getObservation:", fetchReturn.error);
        return reply.status(500).send({ error: fetchReturn.error || "Failed to get weather" });
    }
    reply.send(weatherData);
});

fastify.get<{ Querystring: latLongQueryString }> ("/set_lat_long", { schema: { querystring: latLongQuerySchema } }, async (request, reply) => {
    const {lat, long} = request.query;
    weatherData = structuredClone(initWeatherData);
    weatherLatitude = lat;
    weatherLongitude = long;
    reply.send("Latitude and Longitude have been updated.");
});

fastify.post<{ Body: SetHeatBody }>("/set_heat", {schema: { body: setHeatSchema } }, async (request, reply) => {
    const { deviceID, heatCelsius } = request.body;
    let fetchReturn = await setHeat(deviceID, heatCelsius);
    if (!fetchReturn.success) {
        reply.status(500).send({ error: fetchReturn.error || "Failed to set heat" });
    } else {
        reply.send({ success: true, message: "Heat set successfully", data: fetchReturn.data });
    }
});

fastify.post<{ Body: SetCoolBody }>("/set_cool", {schema: { body: setCoolSchema } }, async (request, reply) => {
    const { deviceID, coolCelsius } = request.body;
    let fetchReturn = await setCool(deviceID,coolCelsius);
    if (!fetchReturn.success) {
        reply.status(500).send({ error: fetchReturn.error || "Failed to set cool" });
    } else {
        reply.send({ success: true, message: "Cool set successfully", data: fetchReturn.data });
    }
});

fastify.post<{ Body: SetRangeBody }>("/set_range", {schema: { body: setRangeSchema } }, async (request, reply) => {
    const { deviceID, heatCelsius, coolCelsius } = request.body;
    let fetchReturn = await setRange(deviceID,heatCelsius, coolCelsius);
    if (!fetchReturn.success) {
        reply.status(500).send({ error: fetchReturn.error || "Failed to set range" });
    } else {
        reply.send({ success: true, message: "Range set successfully", data: fetchReturn.data });
    }
});

fastify.post<{ Body: SetTempModeBody }>("/set_temp_mode", {schema: { body: setTempModeSchema } }, async (request, reply) => {
    const { deviceID, tempMode } = request.body;
    let fetchReturn = await setTempMode(deviceID,tempMode);
    if (!fetchReturn.success) {
        reply.status(500).send({ error: fetchReturn.error || "Failed to set temp mode" });
    } else {
        reply.send({ success: true, message: "TempMode set successfully", data: fetchReturn.data });
    }
});

fastify.post<{ Body: SetEcoModeBody }>("/set_eco_mode", {schema: { body: setEcoModeSchema } }, async (request, reply) => {
    const { deviceID, ecoMode } = request.body;
    let fetchReturn = await setEcoMode(deviceID,ecoMode);
    if (!fetchReturn.success) {
        reply.status(500).send({ error: fetchReturn.error || "Failed to set eco mode" });
    } else {
        reply.send({ success: true, message: "EcoMode set successfully", data: fetchReturn.data });
    }
});

fastify.post<{ Body: SetFanTimerBody }>("/set_fan_timer", {schema: { body: setFanTimerSchema } }, async (request, reply) => {
    const { deviceID, timerMode, durationSeconds } = request.body;
    let fetchReturn = await setFanTimer(deviceID,timerMode, durationSeconds);
    if (!fetchReturn.success) {
        reply.status(500).send({ error: fetchReturn.error || "Failed to set fan timer" });
    } else {
        reply.send({ success: true, message: "Fan Timer set successfully", data: fetchReturn.data });
    }
});

const workerPath = path.join(__dirname, 'dblogging.js'); // Use .js for compiled TypeScript
const worker = dbLogging ? new Worker(workerPath,{workerData: {dbClientConf}}) : null;

async function initializeDBLogging() {
    if (dbLogging && worker !== null) {
        worker.on("message", (message: ThreadRequestDataMessage) => {
            if (message.type === MessageTypes.requestData) {
                const messageResponse: ThreadDataResponseMessage = {
                    type: MessageTypes.dataResponse,
                    data: { tempDataInfo, weatherData}
                };
                worker.postMessage(messageResponse);
            }
        });
        worker.on("error", (error: Error) => {
            console.log("worker thread error:",error);
        });
        worker.on("exit", (code) => {
            console.error("Worker thread exited with code:", code);
        })
        console.log("Worker Thread for DB Logging created. Sending startup message...");
        const startupMessage: ThreadStartupMessage = {type: MessageTypes.startup, data: { tempDataInfo, weatherData}};
        worker.postMessage(startupMessage);

    } else {
        console.log("Not logging data, deactivated.");
    }
}

const start = async () => {
    console.log("Executing main startup process...");
    try {
        console.log("Getting thermostat data and subscribing...");
        await getDataAndSubscribe();
        console.log("Starting fastify listen service on port: ",httpPort);
        await fastify.listen({ port: httpPort, host: "0.0.0.0" });
        if (demoMode) {
            console.log("Getting demo weather data...");
            weatherData = structuredClone(initWeatherData);
        } else {
            console.log("Initializing weather service data retrieval...");
            await initializeWeatherAndRefresh();
        }
        console.log("Setting up worker for database logging...");
        await initializeDBLogging();
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}

start();

async function cleanUp() {
    await removeSubscription();
    if (worker) {
        const shutdownMessage: ThreadShutdownMessage = {type: MessageTypes.shutdown};
        worker.postMessage(shutdownMessage);
    }
    // something something websockets...
    process.exit(0)
}

process.on('SIGINT', async () => {
     console.log('Ctrl+C pressed. Cleaning up...');
     await cleanUp();
     process.exit(0); // Exit with success code 0
   });

process.on('SIGUSR2', async () => {
     console.log('USR2 signal - possibly restarting with nodemon. Cleaning up...');
     await cleanUp();
     process.exit(0); // Exit with success code 0
   });

process.on('SIGTERM', async () => {
     console.log('Received SIGTERM. Cleaning up...');
     await cleanUp();
     process.exit(0); // Exit with success code 0
   });

process.on('exit', async (code) => {
  console.log(`About to exit with code: ${code}`);
});