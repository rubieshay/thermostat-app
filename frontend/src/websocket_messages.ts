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

    const { readyState } = useWebSocket(wsURL, {
    onMessage: (message) => {
        console.log('Received message:', message);
        try {
            const tempMessage: TempMessage = JSON.parse(message.data); 
            console.log("Parsed json of message:",tempMessage);
          // Handle specific event types
            if (tempMessage.type === TempMessageType.tempUpdate) {
                const messageData: TempUpdateMessage = tempMessage.data as TempUpdateMessage
                console.log("about to update temp data array with:",messageData.tempData);
                updateAllTempData(messageData.tempData);
            }
        } catch (error) {
            console.error("Error parsing WebSocket message:", error);
        }
      
    },
    onOpen: () => {
      console.log('Connected to WebSocket server');
    },
    onClose: () => {
      console.log('Disconnected from WebSocket server');
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
    },
    shouldReconnect: () => true,
    reconnectAttempts: 10,
    reconnectInterval: 3000
  });

  console.log("Is WebSocket connected:", readyState)

}