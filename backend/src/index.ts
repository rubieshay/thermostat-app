import Fastify from "fastify";
import fastifyWebSockets from "@fastify/websocket";
import { initTempData, TempData, FetchReturn, WeatherData, initWeatherData } from "./types";
import { latLongQuerySchema, latLongQueryString, setHeatSchema, SetHeatBody, setCoolSchema, 
    SetCoolBody, setRangeSchema, SetRangeBody, setTempModeSchema, SetTempModeBody, setEcoModeSchema, SetEcoModeBody } from "./schemas";
import "dotenv/config";
import { getDeviceInfo, setHeat, setCool, setRange, setMode, setEcoMode} from "./googlesdm";
import { getCurrentObservation } from "./weather";

export const googleClientId  = process.env.CLIENT_ID || "";
export const googleClientSecret = process.env.CLIENT_SECRET || "";
export const googleProjectId = process.env.PROJECT_ID || "";
export const googleRefreshToken = process.env.REFRESH_TOKEN || "";
export const googleDeviceID = process.env.DEVICE_ID || "";
const httpPort = Number(process.env.PORT) || 3000;


export let tempData: TempData = structuredClone(initTempData);
export let weatherData: WeatherData = structuredClone(initWeatherData);

const fastify = Fastify({
    logger: false
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

fastify.get("/info", async (request, reply) => {
    let fetchReturn: FetchReturn;
    fetchReturn = await getDeviceInfo();
    if (!fetchReturn.success) {
        console.log("Got an error in getDeviceInfo:", fetchReturn.error);
        return reply.status(500).send({ error: fetchReturn.error || "Failed to get device info" });
    }
    reply.send(tempData);
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
    const { heatCelsius } = request.body;
    console.log("got a setheat request", heatCelsius);
    let fetchReturn = await setHeat(heatCelsius);
    if (!fetchReturn.success) {
        reply.status(500).send({ error: fetchReturn.error || "Failed to set heat" });
    } else {
        reply.send({ success: true, message: "Heat set successfully", data: fetchReturn.data });
    }
});

fastify.post<{Body: SetCoolBody;}>("/set_cool", {schema: { body: setCoolSchema } }, async (request, reply) => {
    const { coolCelsius } = request.body;
    let fetchReturn = await setCool(coolCelsius);
    if (!fetchReturn.success) {
        reply.status(500).send({ error: fetchReturn.error || "Failed to set cool" });
    } else {
        reply.send({ success: true, message: "Cool set successfully", data: fetchReturn.data });
    }
});

fastify.post<{Body: SetRangeBody;}>("/set_range", {schema: { body: setRangeSchema } }, async (request, reply) => {
    const { heatCelsius, coolCelsius } = request.body;
    let fetchReturn = await setRange(heatCelsius, coolCelsius);
    if (!fetchReturn.success) {
        reply.status(500).send({ error: fetchReturn.error || "Failed to set range" });
    } else {
        reply.send({ success: true, message: "Range set successfully", data: fetchReturn.data });
    }
});

fastify.post<{Body: SetTempModeBody;}>("/set_temp_mode", {schema: { body: setTempModeSchema } }, async (request, reply) => {
    const { mode } = request.body;
    let fetchReturn = await setMode(mode);
    if (!fetchReturn.success) {
        reply.status(500).send({ error: fetchReturn.error || "Failed to set mode" });
    } else {
        reply.send({ success: true, message: "Mode set successfully", data: fetchReturn.data });
    }
});

fastify.post<{Body: SetEcoModeBody;}>("/set_eco_mode", {schema: { body: setEcoModeSchema } }, async (request, reply) => {
    const { mode } = request.body;
    let fetchReturn = await setEcoMode(mode);
    if (!fetchReturn.success) {
        reply.status(500).send({ error: fetchReturn.error || "Failed to set eco mode" });
    } else {
        reply.send({ success: true, message: "Mode set successfully", data: fetchReturn.data });
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