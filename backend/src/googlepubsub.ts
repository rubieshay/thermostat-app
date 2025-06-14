import { googleTopicId, subscriptionId, demoMode, googlePubSubProjectId, sharedMutex } from "./index";
import { Message, PubSub, StatusError, Subscription } from "@google-cloud/pubsub";
import { checkAndGetDeviceInfo, getDeviceInfo, tempDataInfo, updateTempDataInfoFull } from "./googlesdm";
import { TempMessageType, TempMode, TempMessage } from "./types";
import { fastify } from "./index";

let pubSub : PubSub 
let thermoSub : Subscription

export async function getDataAndSubscribe() {
    console.log("Executing initial fetch of data in to backend...");
    let fetchReturn = await getDeviceInfo();
    if (fetchReturn.success) {
        if (demoMode) {
            console.log("Running in demo mode, using demo data, no event subscription needed");
        } else {
            console.log("Retrieved device data... Starting subscription");
            startSubscription();
        }
    }
}

async function startSubscription() {
    console.log("Starting Pub/Sub subscription for thermostat events...");
    pubSub = new PubSub({projectId: googlePubSubProjectId}); 
    console.log("Initiated new PubSub client. Retreiving subscription...");
    thermoSub = pubSub.subscription(subscriptionId);

    thermoSub.on('error', async (e: StatusError) => {
        console.log("Error in pub/sub subscription");
        // Resource Not Found
        if (e.code === 5) {
            console.log('Subscription not found, creating it');
            await pubSub.createSubscription(
                googleTopicId,
                subscriptionId,
                {messageRetentionDuration: 600, filter: null, retainAckedMessages: false }
        );

        // Refresh our subscriber object and re-attach the message handler.
        thermoSub = pubSub.subscription(subscriptionId);
        console.log("Subscription now exists, attaching event handler");
        thermoSub.on('message', thermostatEventHandler);
        }
    });
    console.log("Attaching event handler to subscription");
    thermoSub.on('message', thermostatEventHandler);
}

export async function removeSubscription() {
    if (demoMode) {
        console.log("Running in demo mode, not removing subscription");
        return;
    }
    console.log("Subscription " + subscriptionId + " removed from pub/sub");
    await pubSub.subscription(subscriptionId).delete();
}

const thermostatEventHandler = async (message: Message) => {
    console.log("Received message from pubsub thermostat event:  ",message.id);
    const messageDataStr = message.data.toString('utf-8');
    let jsonEventData: Object;
    try {
        jsonEventData = JSON.parse(messageDataStr);
        console.log("Data:",JSON.stringify(jsonEventData,null,3));
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
        console.log("Event data does not contain resourceUpdate, ignoring event");
        return false;
    }
    const resourceUpdate: any = eventData["resourceUpdate"];
    if (!("name" in resourceUpdate)) {
        console.log("Event data resourceUpdate does not contain name, ignoring event");
        return false;
    }
    const deviceUUIDName: string = resourceUpdate["name"];
    if (!("traits" in resourceUpdate)) {
        console.log("Event data resourceUpdate does not contain traits, ignoring event");
        return false;
    }
    let thermostatDeviceID = deviceUUIDName.substring(deviceUUIDName.lastIndexOf("/")+1);
    const thermostatIndex = newTempDataInfo.findIndex((device) => device.deviceID === thermostatDeviceID);
    if (thermostatIndex === -1) {
        console.log("Event data resourceUpdate does not match any known devices. Getting complete device info refresh");
        return true;
    }
    let traits = resourceUpdate.traits;
    if ("sdm.devices.traits.Info" in traits) {
        if ("customName" in traits["sdm.devices.traits.Info"]) {
            console.log("Updating device name for thermostat");
            newTempDataInfo[thermostatIndex].deviceName = traits["sdm.devices.traits.Info"]["customName"];
        }
    }
    if ("sdm.devices.traits.Humidity" in traits) {
        if ("ambientHumidityPercent" in traits["sdm.devices.traits.Humidity"]) {
            console.log("Updating ambient humidity for thermostat");
            newTempDataInfo[thermostatIndex].ambientHumidity = traits["sdm.devices.traits.Humidity"]["ambientHumidityPercent"];
        }
    }
    if ("sdm.devices.traits.Connectivity" in traits) {
        if ("status" in traits["sdm.devices.traits.Connectivity"]) {
            console.log("Updating connectivity status for thermostat");
            newTempDataInfo[thermostatIndex].connectivity = traits["sdm.devices.traits.Connectivity"]["status"];
        }
    }
    if ("sdm.devices.traits.Fan" in traits) {
        if ("timerMode" in traits["sdm.devices.traits.Fan"] && 
            "timerTimeout" in traits["sdm.devices.traits.Fan"]) {
                let timerMode = traits["sdm.devices.traits.Fan"]["timerMode"];
                let timerTimeout = traits["sdm.devices.traits.Fan"]["timerTimeout"];
                if (timerMode === "OFF") {
                    console.log("Fan timer is OFF, setting fanTimer to null");
                    newTempDataInfo[thermostatIndex].fanTimer = null;
                } else {
                    console.log("Fan timer is ON, setting fanTimer to " + timerTimeout);
                    newTempDataInfo[thermostatIndex].fanTimer = timerTimeout
                }
        };
    }
    if ("sdm.devices.traits.ThermostatMode" in traits) {
        if ("mode" in traits["sdm.devices.traits.ThermostatMode"]) {
            console.log("Updating thermostat mode for thermostat");
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
            console.log("Updating eco mode for thermostat");
            newTempDataInfo[thermostatIndex].ecoMode = traits["sdm.devices.traits.ThermostatEco"]["mode"];
        }
        if ("heatCelsius" in traits["sdm.devices.traits.ThermostatEco"]) {
            console.log("Updating eco heat Celsius for thermostat");
            newTempDataInfo[thermostatIndex].ecoHeatCelsius = traits["sdm.devices.traits.ThermostatEco"]["heatCelsius"];
        }
        if ("coolCelsius" in traits["sdm.devices.traits.ThermostatEco"]) {
            console.log("Updating eco cool Celsius for thermostat");
            newTempDataInfo[thermostatIndex].ecoCoolCelsius = traits["sdm.devices.traits.ThermostatEco"]["coolCelsius"];
        }
    }
    if ("sdm.devices.traits.ThermostatHvac" in traits) {
        if ("status" in traits["sdm.devices.traits.ThermostatHvac"]) {
            console.log("Updating HVAC status for thermostat");
            newTempDataInfo[thermostatIndex].hvacStatus = traits["sdm.devices.traits.ThermostatHvac"]["status"];
        }
    }
    if ("sdm.devices.traits.Settings" in traits) {
        if ("temperatureScale" in traits["sdm.devices.traits.Settings"]) {
            console.log("Updating temperature units for thermostat");
            newTempDataInfo[thermostatIndex].tempUnits = traits["sdm.devices.traits.Settings"]["temperatureScale"];
        }
    }
    if ("sdm.devices.traits.ThermostatTemperatureSetpoint" in traits) {
        if ("heatCelsius" in traits["sdm.devices.traits.ThermostatTemperatureSetpoint"]) {
            console.log("Updating heat Celsius for thermostat");
            newTempDataInfo[thermostatIndex].heatCelsius = traits["sdm.devices.traits.ThermostatTemperatureSetpoint"]["heatCelsius"];
        }
        if ("coolCelsius" in traits["sdm.devices.traits.ThermostatTemperatureSetpoint"]) {
            console.log("Updating cool Celsius for thermostat");
            newTempDataInfo[thermostatIndex].coolCelsius = traits["sdm.devices.traits.ThermostatTemperatureSetpoint"]["coolCelsius"];
        }
    }
    if ("sdm.devices.traits.Temperature" in traits) {
        if ("ambientTemperatureCelsius" in traits["sdm.devices.traits.Temperature"]) {
            console.log("Updating ambient temperature Celsius for thermostat");
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
    console.log("Received an update to thermostat data, broadcasting to clients...");
    fastify.websocketServer.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
            try {
                client.send(JSON.stringify(tempMessage));
                console.log("Sent new data to client : ");
            } catch (error) {
                console.error("Error sending data to client:", error);
            }
        }
    })

}