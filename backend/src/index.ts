import Fastify from "fastify";
import fastifyWebSockets from "@fastify/websocket";
import { FetchReturn, WeatherData, initWeatherData } from "./types";
import { infoQuerySchema, InfoQueryString, latLongQuerySchema, latLongQueryString, setHeatSchema, SetHeatBody, 
        setCoolSchema, SetCoolBody, setRangeSchema, SetRangeBody, setTempModeSchema,
        SetTempModeBody, setEcoModeSchema, SetEcoModeBody, setFanTimerSchema, SetFanTimerBody} from "./schemas";
import "dotenv/config";
import { checkAndGetDeviceInfo, setHeat, setCool, setRange, setTempMode, setEcoMode, setFanTimer} from "./googlesdm";
import { getCurrentObservation } from "./weather";

export const googleClientId  = process.env.CLIENT_ID || "";
export const googleClientSecret = process.env.CLIENT_SECRET || "";
export const googleProjectId = process.env.PROJECT_ID || "";
export const googleRefreshToken = process.env.REFRESH_TOKEN || "";
export const demoMode = ( process.env.DEMO_MODE?.toUpperCase() === "1" || process.env.DEMO_MODE?.toUpperCase() === "YES" || 
    process.env.DEMO_MODE?.toUpperCase() === "TRUE" ? true : false );

const httpPort = Number(process.env.PORT) || 3000;

import {tempDataInfo} from "./googlesdm";
export let weatherData: WeatherData = structuredClone(initWeatherData);

const fastify = Fastify({
    logger: true
})

fastify.register(fastifyWebSockets);

fastify.register( async function (fastify) {
    fastify.get("/ws", { websocket: true,},
        (socket, req) => {
            // TODO : initial connect action -- start regular thermostat polling
            console.log("Initial WS Connect");
            let timer = setInterval(() => {
            socket.send("TEST");
        }, 1000);
            socket.on("message", (msg: string) => {
                socket.send(`Hello from Fastify. Your message is ${msg}`);
                //TODO -- is there even a need for receiving messages from client?
                // Those might normally just go over the regular API calls
            });
            socket.on("close", () => {
                console.log("WS closed by client");
                clearInterval(timer);
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
        console.log("Got an error in getDeviceInfo:", fetchReturn.error);
        if (!fetchReturn.httpCode) {fetchReturn.httpCode = 500;}
        return reply.status(fetchReturn.httpCode).send({ error: fetchReturn.error || "Failed to get device info" });
    }
    reply.send(tempDataInfo);
})

fastify.get("/weather", async (request, reply) => {
    let fetchReturn: FetchReturn;
    fetchReturn = await getCurrentObservation();
    if (!fetchReturn.success) {
        console.log("Got an error in getObservation:", fetchReturn.error);
        return reply.status(500).send({ error: fetchReturn.error || "Failed to get weather" });
    }
    reply.send(weatherData);
})

fastify.get<{ Querystring: latLongQueryString }> ("/set_lat_long", { schema: { querystring: latLongQuerySchema } }, async (request, reply) => {
    const {lat, long} = request.query;
    weatherData = structuredClone(initWeatherData);
    weatherData.latitude = lat;
    weatherData.longitude = long;
    reply.send("Latitude and Longitude have been updated:"+ JSON.stringify(weatherData));
});

fastify.post<{ Body: SetHeatBody }>("/set_heat", {schema: { body: setHeatSchema } }, async (request, reply) => {
    const { deviceID, heatCelsius } = request.body;
    console.log("got a setheat request", deviceID, heatCelsius);
    let fetchReturn = await setHeat(deviceID, heatCelsius);
    if (!fetchReturn.success) {
        reply.status(500).send({ error: fetchReturn.error || "Failed to set heat" });
    } else {
        reply.send({ success: true, message: "Heat set successfully", data: fetchReturn.data });
    }
});

fastify.post<{Body: SetCoolBody;}>("/set_cool", {schema: { body: setCoolSchema } }, async (request, reply) => {
    const { deviceID, coolCelsius } = request.body;
    let fetchReturn = await setCool(deviceID,coolCelsius);
    if (!fetchReturn.success) {
        reply.status(500).send({ error: fetchReturn.error || "Failed to set cool" });
    } else {
        reply.send({ success: true, message: "Cool set successfully", data: fetchReturn.data });
    }
});

fastify.post<{Body: SetRangeBody;}>("/set_range", {schema: { body: setRangeSchema } }, async (request, reply) => {
    const { deviceID, heatCelsius, coolCelsius } = request.body;
    let fetchReturn = await setRange(deviceID,heatCelsius, coolCelsius);
    if (!fetchReturn.success) {
        reply.status(500).send({ error: fetchReturn.error || "Failed to set range" });
    } else {
        reply.send({ success: true, message: "Range set successfully", data: fetchReturn.data });
    }
});

fastify.post<{Body: SetTempModeBody;}>("/set_temp_mode", {schema: { body: setTempModeSchema } }, async (request, reply) => {
    const { deviceID, tempMode } = request.body;
    let fetchReturn = await setTempMode(deviceID,tempMode);
    if (!fetchReturn.success) {
        reply.status(500).send({ error: fetchReturn.error || "Failed to set temp mode" });
    } else {
        reply.send({ success: true, message: "TempMode set successfully", data: fetchReturn.data });
    }
});

fastify.post<{Body: SetEcoModeBody;}>("/set_eco_mode", {schema: { body: setEcoModeSchema } }, async (request, reply) => {
    console.log("Got a setEcoMode request");
    const { deviceID, ecoMode } = request.body;
    let fetchReturn = await setEcoMode(deviceID,ecoMode);
    if (!fetchReturn.success) {
        reply.status(500).send({ error: fetchReturn.error || "Failed to set eco mode" });
    } else {
        reply.send({ success: true, message: "EcoMode set successfully", data: fetchReturn.data });
    }
});

fastify.post<{Body: SetFanTimerBody;}>("/set_fan_timer", {schema: { body: setFanTimerSchema } }, async (request, reply) => {
    console.log("Got set fan timer request: ",request.body);
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
        await fastify.listen({ port: httpPort, host: "0.0.0.0" })
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}

start();