import { useContext } from "react";
import { tempUnitsOptions } from "../utils/constants";
import { SettingsContext } from "../contexts/settings_context";

function TempUnitsSetting() {
    const {tempUnitsSetting, setTempUnitsSetting} = useContext(SettingsContext);

    return (
        <div className="input-group">
            <div className="label">Temperature Units</div>
            <ul className="radio-buttons">
                {tempUnitsOptions.map((option) => (
                    <li key={option.tempUnitsSetting}
                    className={tempUnitsSetting === option.tempUnitsSetting ? "radio-selected" : ""}> 
                        <button onClick={() => {setTempUnitsSetting(option.tempUnitsSetting)}}>{option.displayText}</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default TempUnitsSetting;