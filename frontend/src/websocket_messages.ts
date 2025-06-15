import { useContext} from "react";
import { defaultAPIURL } from "./utils";
import { TempMessageType, type TempUpdateMessage, type TempMessage } from "./types";
import { TempDataContext } from "./temp_data_context";
import useWebSocket from 'react-use-websocket';


function removeProtocol(url: string) {
  return url.replace(/^https?:\/\//, '');
}

function getWebsocketProtocol(url: string) {
  return url.startsWith('https') ? 'wss' : 'ws';
}

const wsURL = getWebsocketProtocol(defaultAPIURL) + "://" + removeProtocol(defaultAPIURL) + "/ws";

export function useSocketMessages() {
    const {updateAllTempData} = useContext(TempDataContext);

    useWebSocket(wsURL, {
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