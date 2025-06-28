import { googleTopicId, subscriptionId, demoMode, googlePubSubProjectId, sharedMutex } from "./index";
import { Message, PubSub, StatusError, Subscription } from "@google-cloud/pubsub";
import { checkAndGetDeviceInfo, getDeviceInfo, tempDataInfo, updateTempDataInfoFull } from "./googlesdm";
import { TempMessageType, TempMode, TempMessage } from "./types";
import { fastify } from "./index";
import { getDefaultAutoSelectFamily } from "net";

let pubSub : PubSub 
let thermoSub : Subscription

const tempIntervalSeconds = 300; // should not need to refresh that often
let tempInterval: NodeJS.Timeout;


export async function getDataAndSubscribe() {
    console.debug("Executing initial fetch of data in to backend...");
    let fetchReturn = await checkAndGetDeviceInfo(true);
    if (fetchReturn.success) {
        if (demoMode) {
            console.debug("Running in demo mode, using demo data, no event subscription needed");
        } else {
            console.debug("Retrieved device data... Starting subscription");
            await startSubscription();
            await startTempDataRefreshTimer();
        }
    }
}

async function startTempDataRefreshTimer() {
    tempInterval = setInterval( async () => {
        await checkAndGetDeviceInfo(true);
    },tempIntervalSeconds*1000)
}

export async function cleanupTempData() {
    clearInterval(tempInterval);
    await removeSubscription();
    fastify.websocketServer.clients.forEach((client) => {
        client.close(1001);
    });
}

async function startSubscription() {
    console.debug("Starting Pub/Sub subscription for thermostat events...");
    pubSub = new PubSub({projectId: googlePubSubProjectId}); 
    thermoSub = pubSub.subscription(subscriptionId);

    thermoSub.on('error', async (e: StatusError) => {
        console.error("Error in pub/sub subscription. Creating new one if doesn't exist");
        // Resource Not Found
        if (e.code === 5) {
            await pubSub.createSubscription(
                googleTopicId,
                subscriptionId,
                {messageRetentionDuration: 600, filter: null, retainAckedMessages: false }
        );

        // Refresh our subscriber object and re-attach the message handler.
        thermoSub = pubSub.subscription(subscriptionId);
        thermoSub.on('message', thermostatEventHandler);
        console.debug("Successfully created new subscription");
        }
    });
    thermoSub.on('message', thermostatEventHandler);
}

async function removeSubscription() {
    if (demoMode) {
        console.debug("Running in demo mode, not removing subscription");
        return;
    }
    console.debug("Subscription " + subscriptionId + " removed from pub/sub");
    await pubSub.subscription(subscriptionId).delete();
}

const thermostatEventHandler = async (message: Message) => {
    const messageDataStr = message.data.toString('utf-8');
    let jsonEventData: Object;
    try {
        jsonEventData = JSON.parse(messageDataStr);
        let needFullRefresh = await updateExclusiveEventData(jsonEventData);
        if (needFullRefresh) {
            await checkAndGetDeviceInfo(true);
        }
    } catch(error) {
        console.error("Error parsing message data as JSON:", error);
        console.error("Message data was:", messageDataStr);
        jsonEventData = {};
    }    
    // "Ack" (acknowledge receipt of) the message
    message.ack();       
}

async function updateExclusiveEventData(eventData: Object) {
    // This function is used to get the device info with a mutex lock
    return sharedMutex.runExclusive(async () => {
        return await updateEventData(eventData)
    })
}

async function updateEventData(eventData: Object): Promise<boolean> {
    // Event Data is structured as follows:
    // {
    //   timeStamp: "UTC Time String",
    //   resourceUpdate: {
    //     name: "enterprises/<project-id>/devices/<device-id>",
    //     traits: {
    //       "sdm.devices.traits.ThermostatMode": {
    //         mode: "COOL" }
    //        === other sdm.devices.traits the same as initial info ===
    //     }
    //   }

    let newTempDataInfo = structuredClone(tempDataInfo);
    if (!("resourceUpdate" in eventData)) {
        console.error("Event data does not contain resourceUpdate, ignoring event");
        return false;
    }
    const resourceUpdate: any = eventData["resourceUpdate"];
    if (!("name" in resourceUpdate)) {
        console.error("Event data resourceUpdate does not contain name, ignoring event");
        return false;
    }
    const deviceUUIDName: string = resourceUpdate["name"];
    if (!("traits" in resourceUpdate)) {
        console.error("Event data resourceUpdate does not contain traits, ignoring event");
        return false;
    }
    let thermostatDeviceID = deviceUUIDName.substring(deviceUUIDName.lastIndexOf("/")+1);
    const thermostatIndex = newTempDataInfo.findIndex((device) => device.deviceID === thermostatDeviceID);
    if (thermostatIndex === -1) {
        console.error("Event data resourceUpdate does not match any known devices. Getting complete device info refresh");
        return true;
    }
    let traits = resourceUpdate.traits;
    if ("sdm.devices.traits.Info" in traits) {
        if ("customName" in traits["sdm.devices.traits.Info"]) {
            newTempDataInfo[thermostatIndex].deviceName = traits["sdm.devices.traits.Info"]["customName"];
        }
    }
    if ("sdm.devices.traits.Humidity" in traits) {
        if ("ambientHumidityPercent" in traits["sdm.devices.traits.Humidity"]) {
            newTempDataInfo[thermostatIndex].ambientHumidity = traits["sdm.devices.traits.Humidity"]["ambientHumidityPercent"];
        }
    }
    if ("sdm.devices.traits.Connectivity" in traits) {
        if ("status" in traits["sdm.devices.traits.Connectivity"]) {
            newTempDataInfo[thermostatIndex].connectivity = traits["sdm.devices.traits.Connectivity"]["status"];
        }
    }
    if ("sdm.devices.traits.Fan" in traits) {
        if ("timerMode" in traits["sdm.devices.traits.Fan"] && 
            "timerTimeout" in traits["sdm.devices.traits.Fan"]) {
                let timerMode = traits["sdm.devices.traits.Fan"]["timerMode"];
                let timerTimeout = traits["sdm.devices.traits.Fan"]["timerTimeout"];
                if (timerMode === "OFF") {
                    newTempDataInfo[thermostatIndex].fanTimer = null;
                } else {
                    newTempDataInfo[thermostatIndex].fanTimer = timerTimeout
                }
        };
    }
    if ("sdm.devices.traits.ThermostatMode" in traits) {
        if ("mode" in traits["sdm.devices.traits.ThermostatMode"]) {
            let newTempMode = traits["sdm.devices.traits.ThermostatMode"]["mode"];
            newTempDataInfo[thermostatIndex].tempMode = newTempMode;;
            if (newTempMode === TempMode.cool) {
                newTempDataInfo[thermostatIndex].heatCelsius = null;
            } else if (newTempMode === TempMode.heat) {
                newTempDataInfo[thermostatIndex].coolCelsius = null;
            } else if (newTempMode === TempMode.off) {
                newTempDataInfo[thermostatIndex].heatCelsius = null;
                newTempDataInfo[thermostatIndex].coolCelsius = null;
            }
        }
    }
    if ("sdm.devices.traits.ThermostatEco" in traits) {
        if ("mode" in traits["sdm.devices.traits.ThermostatEco"]) {
            newTempDataInfo[thermostatIndex].ecoMode = traits["sdm.devices.traits.ThermostatEco"]["mode"];
        }
        if ("heatCelsius" in traits["sdm.devices.traits.ThermostatEco"]) {
            newTempDataInfo[thermostatIndex].ecoHeatCelsius = traits["sdm.devices.traits.ThermostatEco"]["heatCelsius"];
        }
        if ("coolCelsius" in traits["sdm.devices.traits.ThermostatEco"]) {
            newTempDataInfo[thermostatIndex].ecoCoolCelsius = traits["sdm.devices.traits.ThermostatEco"]["coolCelsius"];
        }
    }
    if ("sdm.devices.traits.ThermostatHvac" in traits) {
        if ("status" in traits["sdm.devices.traits.ThermostatHvac"]) {
            newTempDataInfo[thermostatIndex].hvacStatus = traits["sdm.devices.traits.ThermostatHvac"]["status"];
        }
    }
    if ("sdm.devices.traits.Settings" in traits) {
        if ("temperatureScale" in traits["sdm.devices.traits.Settings"]) {
            newTempDataInfo[thermostatIndex].tempUnits = traits["sdm.devices.traits.Settings"]["temperatureScale"];
        }
    }
    if ("sdm.devices.traits.ThermostatTemperatureSetpoint" in traits) {
        if ("heatCelsius" in traits["sdm.devices.traits.ThermostatTemperatureSetpoint"]) {
            newTempDataInfo[thermostatIndex].heatCelsius = traits["sdm.devices.traits.ThermostatTemperatureSetpoint"]["heatCelsius"];
        }
        if ("coolCelsius" in traits["sdm.devices.traits.ThermostatTemperatureSetpoint"]) {
            newTempDataInfo[thermostatIndex].coolCelsius = traits["sdm.devices.traits.ThermostatTemperatureSetpoint"]["coolCelsius"];
        }
    }
    if ("sdm.devices.traits.Temperature" in traits) {
        if ("ambientTemperatureCelsius" in traits["sdm.devices.traits.Temperature"]) {
            newTempDataInfo[thermostatIndex].ambientTempCelsius = traits["sdm.devices.traits.Temperature"]["ambientTemperatureCelsius"];
        }
    }
    updateTempDataInfoFull(newTempDataInfo);
    await broadcastNewTempData()
    return false;
}

async function broadcastNewTempData() {
    let tempMessage: TempMessage = {
        type: TempMessageType.tempUpdate,
        data: {
            tempData: tempDataInfo
        }
    }
    console.debug("Received an update to thermostat data, broadcasting to clients...");
    fastify.websocketServer.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
            try {
                client.send(JSON.stringify(tempMessage));
            } catch (error) {
                console.error("Error sending data to client:", error);
            }
        }
    })

}
