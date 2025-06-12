import { useContext, useEffect, useState } from "react";
import { tempModeOptions } from "./utils";
import { TempDataContext } from "./temp_context";
import { TempMode } from "./types";

function TempModeDrawer() {
    const {selectedTempData: tempData, debounceTempData, setTempMode} = useContext(TempDataContext);
    const [dispTempMode, setDispTempMode] = useState<TempMode>(TempMode.off);

    useEffect (() => {
        setDispTempMode(tempData.tempMode);
    }, [tempData.tempMode]);
    
    function changeTempMode(event: React.ChangeEvent<HTMLInputElement>) {
        const newTempMode = event.target.value as TempMode;
        setDispTempMode(newTempMode);
        debounceTempData(() => setTempMode(newTempMode), false);
    }

    return (
        <div className="drawer-content">
            <fieldset className="radio-select">
                <legend><h2>Temperature Mode</h2></legend>
                <ul>
                    {tempModeOptions.map((option) => (
                        <li key={option.value}>
                            <input id={"temp-mode-select-" + option.IdText}
                                    name="temp-mode-select" type="radio" value={option.value}
                                    checked={dispTempMode === option.value}
                                    onChange={(event) => changeTempMode(event)}/>
                            <label htmlFor={"temp-mode-select-" + option.IdText}>
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

export default TempModeDrawer;