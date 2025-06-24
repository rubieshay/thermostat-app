import { useContext } from "react";
import { tempUnitsOptions } from "../utils/constants";
import { SettingsContext } from "../contexts/settings_context";

function TempUnitsSetting() {
    const {tempUnitsSetting, setTempUnitsSetting} = useContext(SettingsContext);
    const radioSelectedIndex = Math.max(0, tempUnitsOptions.findIndex((option) => tempUnitsSetting === option.tempUnitsSetting))

    return (
        <div className="input-group">
            <div className="label">Temperature Units</div>
            <ul className="radio-buttons"
            style={{"--radio-options-count": tempUnitsOptions.length, "--radio-selected-index": radioSelectedIndex} as React.CSSProperties}>
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