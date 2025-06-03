import Fastify from "fastify";
import { FromSchema } from "json-schema-to-ts";
import { initTempData, TempData, FetchReturn, WeatherData, initWeatherData } from "./types";
import "dotenv/config";
import { getAccessToken,getDeviceInfo } from "./googlesdm";
import { getCurrentObservation } from "./weather";

export const googleClientId  = process.env.CLIENT_ID || "";
export const googleClientSecret = process.env.CLIENT_SECRET || "";
export const googleProjectId = process.env.PROJECT_ID || "";
export const googleRefreshToken = process.env.REFRESH_TOKEN || "";
export const googleDeviceID = process.env.DEVICE_ID || "";
const httpPort = Number(process.env.PORT) || 3000;


export let tempData: TempData = initTempData;
export let weatherData: WeatherData = initWeatherData;

const fastify = Fastify({
    logger: true
})

fastify.get("/", async (request, reply) => {
    return { hello: "world" }
})

fastify.get("/renewaccess", async (request, reply) => {
    let fetchReturn: FetchReturn;
    fetchReturn = await getAccessToken();
    if (!fetchReturn.success) {
        return reply.status(500).send({ error: fetchReturn.error || "Failed to get access token" });
    } else {
        console.log("Access Token Renewed:", fetchReturn);
        return { success: true, message: "Access token renewed successfully" };
    }
})

fastify.get("/info", async (request, reply) => {
    let fetchReturn: FetchReturn;
    fetchReturn = await getDeviceInfo();
    if (!fetchReturn.success) {
        console.log("Got an error in getDeviceInfo:",fetchReturn.error);
        return reply.status(500).send({ error: fetchReturn.error || "Failed to get device info" });
    }
    return { tempData }
})

fastify.get("/weather", async (request, reply) => {
    let fetchReturn: FetchReturn;
    fetchReturn = await getCurrentObservation();
    if (!fetchReturn.success) {
        console.log("Got an error in getObservation:",fetchReturn.error);
        return reply.status(500).send({ error: fetchReturn.error || "Failed to get weather" });
    }
    reply.send(weatherData);
})

const latLongQuerySchema = {
    type: 'object',
    properties: {
        lat: {type: "number"},
        long: {type: "number"}
    },
    required: ["lat","long"]
} as const;

type latLongQueryString = FromSchema<typeof latLongQuerySchema>;

fastify.get<{ Querystring: latLongQueryString }> ("/setlatlong",{ schema: { querystring: latLongQuerySchema } }, async (request, reply) => {
    const {lat, long} = request.query;
    weatherData = initWeatherData;
    weatherData.latitude = lat;
    weatherData.longitude = long;
    reply.send("Latitude and Longitude have been updated:"+ JSON.stringify(weatherData));
})

const start = async () => {
    try {
        await fastify.listen({ port: httpPort, host: "0.0.0.0" })
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}

start();