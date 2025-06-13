import { googleClientSecret, googleRefreshToken, googleClientId, googleProjectId, googleTopicId, environment, demoMode } from "./index";


import { Message, PubSub, StatusError, Subscription } from "@google-cloud/pubsub";

import { getDeviceInfo, tempDataInfo } from "./googlesdm";

const subscriptionId = "thermostat-sub-id-" + environment;
let pubSub : PubSub 
let thermoSub : Subscription


async function startSubscription() {
    pubSub = new PubSub({projectId: googleProjectId});    
    thermoSub = pubSub.subscription(subscriptionId);

    thermoSub.on('error', async (e: StatusError) => {
        // Resource Not Found
        if (e.code === 5) {
        console.log('Subscription not found, creating it');
        await pubSub.createSubscription(
            googleTopicId,
            subscriptionId,
            {messageRetentionDuration: 0, filter: null, retainAckedMessages: false }
        );

        // Refresh our subscriber object and re-attach the message handler.
        thermoSub = pubSub.subscription(subscriptionId);
        thermoSub.on('message', thermostatEventHandler);
        }
    });

    thermoSub.on('message', thermostatEventHandler);

}

export async function removeSubscription() {
    console.log("Subscription " + subscriptionId + " removed from pub/sub");
    pubSub.subscription(subscriptionId).delete();
}




const thermostatEventHandler = (message: Message) => {
    console.log(`Received message from pubsub thermostat event:  ${message.id}:`);
    console.log(`\tData: ${message.data}`);
    console.log(`\tAttributes: ${message.attributes}`);

    // "Ack" (acknowledge receipt of) the message
    message.ack();
        
}


export async function getDataAndSubscribe() {
    let fetchReturn = await getDeviceInfo();
    if (fetchReturn.success) {
        startSubscription();
    }
}