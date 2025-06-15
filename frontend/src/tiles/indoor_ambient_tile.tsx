import { useContext } from "react";
import { TempDataContext } from "../temp_data_context";
import { TempUnits } from "../types";
import { getHumidityIcon, convertTemp, roundedTemp } from "../utils";

function IndoorAmbientTile() {
    const {selectedTempData: tempData} = useContext(TempDataContext);

    const ambientIndoorTempString = roundedTemp(convertTemp(tempData.ambientTempCelsius, TempUnits.celsius, tempData.tempUnits), tempData.tempUnits) ? roundedTemp(convertTemp(tempData.ambientTempCelsius, TempUnits.celsius, tempData.tempUnits), tempData.tempUnits)!.toString() + "\u00B0" : "Not Found";
    const ambientIndoorHumidityString = tempData.ambientHumidity ? Math.round(tempData.ambientHumidity).toString() + "%" : "Not Found";

    return (
        <div className="tile">
            <h2>Indoor</h2>
            <div className="icon-text-group">
                <span className="material-symbols material-symbols-rounded">home</span>
                <span>{ambientIndoorTempString}</span>
            </div>
            <div className="icon-text-group">
                <span className="material-symbols material-symbols-rounded">{getHumidityIcon(tempData.ambientHumidity)}</span>
                <span>{ambientIndoorHumidityString}</span>
            </div>
        </div>
    );
}

export default IndoorAmbientTile;