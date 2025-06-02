import Fastify from "fastify"
import { initTempData, TempData, FetchReturn } from "./types";
import "dotenv/config";
import { getAccessToken,getDeviceInfo } from "./googlesdm";

export const googleClientId  = process.env.CLIENT_ID || "";
export const googleClientSecret = process.env.CLIENT_SECRET || "";
export const googleProjectId = process.env.PROJECT_ID || "";
export const googleRefreshToken = process.env.REFRESH_TOKEN || "";
export const googleDeviceID = process.env.DEVICE_ID || "";
const httpPort = Number(process.env.PORT) || 3000;


export const tempData: TempData = initTempData;

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

const start = async () => {
    try {
        await fastify.listen({ port: httpPort, host: "0.0.0.0" })
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}

start()