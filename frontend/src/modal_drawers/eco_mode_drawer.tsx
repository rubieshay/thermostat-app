import { useContext, useEffect, useState } from "react";
import { ecoModeOptions } from "../utils/constants";
import { TempDataContext } from "../contexts/temp_data_context";
import { EcoMode } from "../types";

function EcoModeDrawer({ handleCloseModal }: {handleCloseModal: () => void}) {
    const {selectedTempData: tempData, debounceTempData, setEcoMode} = useContext(TempDataContext);
    const [currEcoMode, setCurrEcoMode] = useState<EcoMode>(EcoMode.off);

    useEffect (() => {
        setCurrEcoMode(tempData.ecoMode);
    }, [tempData.ecoMode]);
    
    function changeEcoMode(newEcoMode: EcoMode) {
        setCurrEcoMode(newEcoMode);
        debounceTempData(() => setEcoMode(newEcoMode), false);
        handleCloseModal();
    }

    return (
        <div className="drawer-content">
            <h2>Eco Mode</h2>
            <hr/>
            <ul className="radio-select-list">
                {ecoModeOptions.map((option) => (
                    <li key={option.ecoMode} id={"eco-mode-select-" + option.idText} className={currEcoMode === option.ecoMode ? "radio-selected" : ""}>
                        <button className="standard-button icon-text-group" onClick={() => changeEcoMode(option.ecoMode)}>
                            <span className="material-symbols material-symbols-rounded" aria-hidden="true">
                                {option.symbolText}
                            </span>
                            <span>{option.displayText}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default EcoModeDrawer;