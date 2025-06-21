import { useContext} from "react";
import { TempMessageType, type TempUpdateMessage, type TempMessage } from "./types";
import { TempDataContext } from "./temp_data_context";
import useWebSocket from 'react-use-websocket';
import { APIContext } from "./api_context";


function removeProtocol(url: string | null) {
    if (url === null) {
        return "";
    } else {
        return url.replace(/^https?:\/\//, '');
    }
}

function getWebsocketProtocol(url: string | null) {
    if (url === null) {
        return "";
    } else {
        return url.startsWith('https') ? 'wss' : 'ws';
    }
}


export function useSocketMessages(socketsDisabled: boolean) {
    const {updateAllTempData} = useContext(TempDataContext);
    const {apiURL} = useContext(APIContext);
    const wsURL = getWebsocketProtocol(apiURL) + "://" + removeProtocol(apiURL) + "/ws";
    useWebSocket(socketsDisabled ? null  : wsURL, {
        onMessage: (message) => {
            try {
                const tempMessage: TempMessage = JSON.parse(message.data); 
                console.debug("Parsed json of message:",tempMessage);
                // Handle specific event types
                if (tempMessage.type === TempMessageType.tempUpdate) {
                    const messageData: TempUpdateMessage = tempMessage.data as TempUpdateMessage
                    updateAllTempData(messageData.tempData);
                }
            } catch (error) {
                console.error("Error parsing WebSocket message:", error);
            }
        
        },
        onOpen: () => {
            console.debug('Connected to WebSocket server');
        },
        onClose: () => {
            console.debug('Disconnected from WebSocket server');
        },
        onError: (error) => {
            console.error('WebSocket error:', error);
        },
        shouldReconnect: () => true,
        reconnectAttempts: 10,
        reconnectInterval: 3000
    });
}