import Fastify from "fastify";
import fastifyWebSockets from "@fastify/websocket";
import { FetchReturn, TempMessageType, WeatherData, initWeatherData, TempMessage } from "./types";
import { infoQuerySchema, InfoQueryString, latLongQuerySchema, latLongQueryString, setHeatSchema, SetHeatBody, 
        setCoolSchema, SetCoolBody, setRangeSchema, SetRangeBody, setTempModeSchema,
        SetTempModeBody, setEcoModeSchema, SetEcoModeBody, setFanTimerSchema, SetFanTimerBody} from "./schemas";
import { checkAndGetDeviceInfo, setHeat, setCool, setRange, setTempMode, setEcoMode, setFanTimer} from "./googlesdm";
import { getCurrentObservation } from "./weather";
import {tempDataInfo} from "./googlesdm";
import { getDataAndSubscribe, removeSubscription } from "./googlepubsub";
import { Mutex } from "./mutex";

export const googleClientId  = process.env.CLIENT_ID || "";
export const googleClientSecret = process.env.CLIENT_SECRET || "";
export const googleProjectId = process.env.PROJECT_ID || "";
export const googleRefreshToken = process.env.REFRESH_TOKEN || "";
export const googleTopicId = process.env.TOPIC_ID || "thermostat-topic-id";
export const googlePubSubProjectId = process.env.PUBSUB_PROJECT_ID || "";
export const demoMode = ( process.env.DEMO_MODE?.toUpperCase() === "1" || process.env.DEMO_MODE?.toUpperCase() === "YES" || process.env.DEMO_MODE?.toUpperCase() === "TRUE" ? true : false );
export const environment = process.env.ENVIRONMENT || "prod";
export const subscriptionId = "thermostat-sub-id-" + environment;
export let weatherLatitude = Number(process.env.WEATHER_LATITUDE) || 39.833333; // Default to Lebanon, KS
export let weatherLongitude = Number(process.env.WEATHER_LONGITUDE) || -98.583333; // Default to Lebanon, KS

const httpPort = Number(process.env.PORT) || 3000;

export let weatherData: WeatherData = structuredClone(initWeatherData);

export const sharedMutex = new Mutex();

export const fastify = Fastify({
    logger: true
})

fastify.register(fastifyWebSockets);

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

fastify.get("/", async (request, reply) => {
    return { hello: "world" }
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

const start = async () => {
    try {
        await getDataAndSubscribe();
        await fastify.listen({ port: httpPort, host: "0.0.0.0" })
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}

start();

async function cleanUp() {
    await removeSubscription();
    // something something websockets...
    process.exit(0)
}

process.on('SIGINT', async () => {
     console.log('Ctrl+C pressed. Cleaning up...');
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