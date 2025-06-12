import { useContext, useEffect, useState } from "react";
import { ecoModeOptions } from "./utils";
import { TempDataContext } from "./temp_context";
import { EcoMode } from "./types";

function EcoModeDrawer() {
    const {selectedTempData: tempData, debounceTempData, setEcoMode} = useContext(TempDataContext);
    const [dispEcoMode, setDispEcoMode] = useState<EcoMode>(EcoMode.off);

    useEffect (() => {
        setDispEcoMode(tempData.ecoMode);
    }, [tempData.ecoMode]);
    
    function changeEcoMode(event: React.ChangeEvent<HTMLInputElement>) {
        const newEcoMode = event.target.value as EcoMode;
        setDispEcoMode(newEcoMode);
        debounceTempData(() => setEcoMode(newEcoMode), false);
    }

    return (
        <div className="drawer-content">
            <fieldset className="radio-select">
                <legend><h2>Eco Mode</h2></legend>
                <ul>
                    {ecoModeOptions.map((option) => (
                        <li key={option.value}>
                            <input id={"eco-mode-select-" + option.IdText}
                                    name="eco-mode-select" type="radio" value={option.value}
                                    checked={dispEcoMode === option.value}
                                    onChange={(event) => changeEcoMode(event)}/>
                            <label htmlFor={"eco-mode-select-" + option.IdText}>
                                <span className="material-symbols material-symbols-rounded">
                                    {option.symbolText}
                                </span>
                                <span>{option.dispText}</span>
                            </label>
                        </li>
                    ))}
                </ul>
            </fieldset>
        </div>
    );
}

export default EcoModeDrawer;