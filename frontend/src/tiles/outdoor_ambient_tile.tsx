import { useContext } from "react";
import { TempUnits } from "../types";
import { convertTemp, getHumidityIcon, getWeatherIcon, roundedTemp } from "../utils/functions";
import { useActualTempUnits } from "../utils/hooks";
import { WeatherContext } from "../contexts/weather_context";

function OutdoorAmbientTile() {
    const {weatherData} = useContext(WeatherContext);
    const tempUnits = useActualTempUnits();

    function getAmbientOutdoorTempString() {
        const ambientValue = roundedTemp(convertTemp(weatherData.currentTemperature, TempUnits.celsius, tempUnits), tempUnits);
        if (ambientValue !== null) {
            return ambientValue.toString() + "\u00B0";
        } else {
            return "Not Found";
        }
    }

    function getAmbientOutdoorHumidityString() {
        if (weatherData.currentRelativeHumidity !== null) {
            return Math.round(weatherData.currentRelativeHumidity).toString() + "%";
        } else {
            return "Not Found";
        }
    }

    const humidityIconSymbolText = getHumidityIcon(weatherData.currentRelativeHumidity);
    const ambientOutdoorTempString = getAmbientOutdoorTempString();
    const ambientOutdoorHumidityString = getAmbientOutdoorHumidityString();
    const weatherIcon = getWeatherIcon(weatherData.currentWeatherIconURL);
    const weatherTitleString = "Outdoor " + ((weatherData.observationCity !== null && weatherData.observationCity !== "") ? "(" + weatherData.observationCity + ")" : "");

    return (
        <div className="tile">
            <h2 className="text-ellipses">{weatherTitleString}</h2>
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