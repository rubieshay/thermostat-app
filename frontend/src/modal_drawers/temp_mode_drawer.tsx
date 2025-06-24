import { useContext, useEffect, useState } from "react";
import { tempModeOptions } from "../utils/constants";
import { TempDataContext } from "../contexts/temp_data_context";
import { TempMode } from "../types";

function TempModeDrawer({ handleCloseModal }: {handleCloseModal: () => void}) {
    const {selectedTempData: tempData, debounceTempData, setTempMode} = useContext(TempDataContext);
    const [currTempMode, setCurrTempMode] = useState<TempMode>(TempMode.off);

    useEffect (() => {
        setCurrTempMode(tempData.tempMode);
    }, [tempData.tempMode]);
    
    function changeTempMode(newTempMode: TempMode) {
        setCurrTempMode(newTempMode);
        debounceTempData(() => setTempMode(newTempMode), false);
        handleCloseModal();
    }

    return (
        <div className="drawer-content">
            <h2>HVAC Mode</h2>
            <hr/>
            <ul className="radio-select-list">
                {tempModeOptions.map((option) => (
                    <li key={option.tempMode} id={"temp-mode-select-" + option.idText} className={currTempMode === option.tempMode ? "radio-selected" : ""}>
                        <button className="standard-button icon-text-group" onClick={() => changeTempMode(option.tempMode)}>
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

export default TempModeDrawer;