import { useContext, useState, useEffect } from "react";
import { TempDataContext } from "../temp_data_context";
import { demoWeatherData, TempUnits } from "../types";
import { convertTemp, defaultAPIURL, demoMode, getHumidityIcon, getWeatherIcon, roundedTemp } from "../utils";

function OutdoorAmbientTile() {
    const {selectedTempData: tempData} = useContext(TempDataContext);
    const [ambientOutdoorTemp, setAmbientOutdoorTemp] = useState<number | null>(null);
    const [ambientOutdoorHumidity, setAmbientOutdoorHumidity] = useState<number | null>(null);
    const [weatherIcon, setWeatherIcon] = useState<{symbolText: string, ariaText: string}>(getWeatherIcon(null));
    const [weatherCity, setWeatherCity] = useState<string | null>(null);
    const humidityIconSymbolText = getHumidityIcon(ambientOutdoorHumidity);

    useEffect(() => {
        getWeather();
    }, []);
    
    const ambientOutdoorTempString = roundedTemp(convertTemp(ambientOutdoorTemp, TempUnits.celsius, tempData.tempUnits), tempData.tempUnits) ? roundedTemp(convertTemp(ambientOutdoorTemp, TempUnits.celsius, tempData.tempUnits), tempData.tempUnits)!.toString() + "\u00B0" : "Not Found";
    const ambientOutdoorHumidityString = ambientOutdoorHumidity ? Math.round(ambientOutdoorHumidity).toString() + "%" : "Not Found";

    async function getWeather() {
        if (demoMode) {
            setAmbientOutdoorTemp(demoWeatherData.currentTemperature);
            setAmbientOutdoorHumidity(demoWeatherData.currentRelativeHumidity);
            setWeatherIcon(getWeatherIcon(demoWeatherData.currentWeatherIconURL));
            setWeatherCity(demoWeatherData.observationCity);
            return;
        }
        const url = defaultAPIURL + "/weather";
        console.log("URL:", url);
        try {
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            });
            if (!response.ok) {
                console.error("Failed to get weather : " + response.statusText);
                return;
            }
            const weatherData = await response.json();
            setAmbientOutdoorTemp(weatherData.currentTemperature);
            setAmbientOutdoorHumidity(weatherData.currentRelativeHumidity);
            setWeatherIcon(getWeatherIcon(weatherData.currentWeatherIconURL));
            setWeatherCity(weatherData.observationCity);
        } catch (error) {
            console.error("Error with weather api:", error);
        }
    }

    return (
        <div className="tile">
            <h2 className="text-ellipses">Outdoor {(weatherCity !== null && weatherCity !== "") ? "(" + weatherCity + ")" : ""}</h2>
            <div className="icon-text-group">
                <span className="material-symbols material-symbols-rounded" aria-label={weatherIcon.ariaText}>
                    {weatherIcon.symbolText}
                </span>
                <span>{ambientOutdoorTempString}</span>
            </div>
            <div className="icon-text-group">
                <span className="material-symbols material-symbols-rounded" aria-label="Outdoor Humidity">
                    {humidityIconSymbolText}
                    </span>
                <span>{ambientOutdoorHumidityString}</span>
            </div>
        </div>
    );
}

export default OutdoorAmbientTile;