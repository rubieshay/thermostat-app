import { useContext } from "react";
import { TempDataContext } from "../contexts/temp_data_context";
import { TempUnits } from "../types";
import { getHumidityIcon, convertTemp, roundedTemp } from "../utils/functions";
import { useActualTempUnits } from "../utils/hooks";

function IndoorAmbientTile() {
    const {selectedTempData: tempData} = useContext(TempDataContext);
    const tempUnits = useActualTempUnits();

    const ambientIndoorTempString = roundedTemp(convertTemp(tempData.ambientTempCelsius, TempUnits.celsius, tempUnits), tempUnits) ? roundedTemp(convertTemp(tempData.ambientTempCelsius, TempUnits.celsius, tempUnits), tempUnits)!.toString() + "\u00B0" : "Not Found";
    const ambientIndoorHumidityString = tempData.ambientHumidity ? Math.round(tempData.ambientHumidity).toString() + "%" : "Not Found";

    return (
        <div className="tile">
            <h2>Indoor</h2>
            <div className="icon-text-group">
                <span className="material-symbols material-symbols-rounded" aria-label="Indoor Temperature">
                    {"\ue88a"}
                </span>
                <span>{ambientIndoorTempString}</span>
            </div>
            <div className="icon-text-group">
                <span className="material-symbols material-symbols-rounded" aria-label="Indoor Humidity">{getHumidityIcon(tempData.ambientHumidity)}</span>
                <span>{ambientIndoorHumidityString}</span>
            </div>
        </div>
    );
}

export default IndoorAmbientTile;