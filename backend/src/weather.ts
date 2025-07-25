import { FetchReturn, TempMessage, TempMessageType } from "./types";
import { weatherData, weatherLatitude, weatherLongitude } from "./index";
import { arraysEqualIgnoreOrder } from "./utils";
import { fastify } from "./index";
import log from './logger';

const weatherBaseURL = "https://api.weather.gov/"

const weatherDataExpireDurationSecs = 180;

const weatherDataAutoRefreshSecs = 300;

let weatherInterval: NodeJS.Timeout;

async function getStationsFromLatLong(): Promise<FetchReturn> {
    let pointsURL = encodeURI(weatherBaseURL + "/points/"+ weatherLatitude + "," + weatherLongitude);
    let fetchReturn: FetchReturn = {success: false};
       try {
        const response = await fetch(pointsURL);
        if (!response.ok) {
            fetchReturn.httpCode = response.status;
            fetchReturn.error = "Get Weather Stations Failed:" + response.statusText;
            return fetchReturn;
        }
        const data = await response.json(); // Or response.text() for text responses
        fetchReturn.success = true;
        weatherData.observationStationsURL = data.properties.observationStations;
        weatherData.forecastURL = data.properties.forecast;
        weatherData.gridId = data.properties.gridId;
        log.trace("Retrieved stations URL, forecast URL, and gridID:" + JSON.stringify(weatherData));
    } catch (error) {
        // Handle network errors or errors thrown by the if statement above
        if (error instanceof Error) {
            fetchReturn.error = "Get Stations Fetch error: " + error.message;
        } else {
            fetchReturn.error = "Get Stations Unknown fetch error";
        }
    }
    return fetchReturn;
}

async function checkAndGetLatLong(): Promise<FetchReturn> {
    let fetchReturn: FetchReturn = {success: false};
    if (weatherData.observationStation === null) {
        fetchReturn = await getStationsFromLatLong();
        return fetchReturn;
    } else {
        fetchReturn.httpCode = 302;
        fetchReturn.success = true;
        return fetchReturn;
    }
}

async function getObservationStations(): Promise<FetchReturn> {
    let fetchReturn: FetchReturn = {success: false};
    fetchReturn = await checkAndGetLatLong();
    if (!fetchReturn.success) {return fetchReturn};
    if (weatherData.observationStationsURL === null) {
        fetchReturn.httpCode = 404;
        fetchReturn.error = "Observation URL is null";
        return fetchReturn;
    }
    let stationsURL = encodeURI(weatherData.observationStationsURL);
       try {
        const response = await fetch(stationsURL);
        if (!response.ok) {
            fetchReturn.httpCode = response.status;
            fetchReturn.error = "Get Observation Stations Failed:"+response.statusText;
            return fetchReturn;
        }
        const data = await response.json(); // Or response.text() for text responses
        fetchReturn.success = true;
        log.trace("Got observations station data:",JSON.stringify(data.features[0]));
        weatherData.observationStation = data.features[0].properties.stationIdentifier;
        const cityAirportName = data.features[0].properties.name;
        weatherData.observationCity = cityAirportName.split(",")[0]; 
        weatherData.observationURL = encodeURI(weatherBaseURL + "stations/" + weatherData.observationStation + "/observations/latest");
        log.trace("New observation station data retrieved:" + JSON.stringify(weatherData));
    } catch (error) {
        // Handle network errors or errors thrown by the if statement above
        if (error instanceof Error) {
            fetchReturn.error = "Get Stations Fetch error: " + error.message;
        } else {
            fetchReturn.error = "Get Stations Unknown fetch error";
        }
    }
    return fetchReturn;
}

async function checkAndGetObservationStations(): Promise<FetchReturn> {
    let fetchReturn: FetchReturn = {success: false};
    if (weatherData.observationStation === null) {
        fetchReturn = await getObservationStations();
        return fetchReturn;
    } else {
        fetchReturn.httpCode = 302;
        fetchReturn.success = true;
        return fetchReturn;
    }
}

export async function getCurrentObservation(): Promise<FetchReturn> {
    let fetchReturn: FetchReturn = {success: false};
    fetchReturn = await checkAndGetObservationStations();
    if (!fetchReturn.success) {return fetchReturn;};
    if (weatherData.lastCheckTime !== null && new Date() < (new Date(weatherData.lastCheckTime.getTime() + 1000*(weatherDataExpireDurationSecs)))) {
        log.debug("The data is fresh, no need to retrieve.");
        fetchReturn.httpCode = 302;
        return fetchReturn;
    }
    if (weatherData.observationURL === null) {
        fetchReturn.httpCode = 404;
        fetchReturn.error = "Observations URL is null";
        return fetchReturn;
    }
       try {
        const response = await fetch(weatherData.observationURL!);
        if (!response.ok) {
            fetchReturn.httpCode = response.status;
            fetchReturn.error = "Get Observation Failed:"+response.statusText;
            return fetchReturn;
        }
        const data = await response.json(); // Or response.text() for text responses
        fetchReturn.success = true;
        weatherData.lastCheckTime = new Date();
        weatherData.currentTextDescription = data.properties.textDescription;
        weatherData.currentTemperature = data.properties.temperature.value;
        weatherData.currentRelativeHumidity = data.properties.relativeHumidity.value;
        weatherData.currentWeatherIconURL = data.properties.icon;
        log.trace("New weather data retrieved:",JSON.stringify(weatherData,null,3));
    } catch (error) {
        // Handle network errors or errors thrown by the if statement above
        if (error instanceof Error) {
            fetchReturn.error = "Get Observations Fetch error: " + error.message;
        } else {
            fetchReturn.error = "Get Observations Unknown fetch error";
        }
    }
    return fetchReturn;
}

async function broadcastNewWeatherData() {
    let tempMessage: TempMessage = {
        type: TempMessageType.tempUpdate,
        data: {
            weatherData: weatherData
        }
    }
    log.debug("Received an update to weather data, broadcasting to clients...");
    fastify.websocketServer.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
            try {
                client.send(JSON.stringify(tempMessage));
            } catch (error) {
                log.error("Error sending data to client:", error);
            }
        }
    })
}

async function getWeatherCheckAndSend() {
    let oldWeatherData = weatherData;
    await getCurrentObservation();
    if (!arraysEqualIgnoreOrder([oldWeatherData],[weatherData])) {
        await broadcastNewWeatherData()
    }
}

export async function initializeWeatherAndRefresh() {
    await getCurrentObservation();
    weatherInterval = setInterval( async () => {await getWeatherCheckAndSend()},weatherDataAutoRefreshSecs*1000)
}

export async function cleanupWeather() {
    clearInterval(weatherInterval);
}

