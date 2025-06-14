import { useContext, useEffect, useState } from "react";
import { tempModeOptions } from "../utils";
import { TempDataContext } from "../temp_data_context";
import { TempMode } from "../types";

interface ModalDrawerProps {
    handleCloseModal: () => void
}

const TempModeDrawer: React.FC<ModalDrawerProps> = ({ handleCloseModal }) => {
    const {selectedTempData: tempData, debounceTempData, setTempMode} = useContext(TempDataContext);
    const [dispTempMode, setDispTempMode] = useState<TempMode>(TempMode.off);

    useEffect (() => {
        setDispTempMode(tempData.tempMode);
    }, [tempData.tempMode]);
    
    function changeTempMode(newTempMode: TempMode) {
        setDispTempMode(newTempMode);
        debounceTempData(() => setTempMode(newTempMode), false);
        handleCloseModal();
    }

    return (
        <div className="drawer-content">
            <h2>Temperature Mode</h2>
            <hr/>
            <ul className="radio-select">
                {tempModeOptions.map((option) => (
                    <li key={option.tempMode} id={"temp-mode-select-" + option.idText} className={dispTempMode === option.tempMode ? "radio-selected" : ""}>
                        <button className="icon-text-group" onClick={() => changeTempMode(option.tempMode)}>
                            <span className="material-symbols material-symbols-rounded">
                                {option.symbolText}
                            </span>
                            <span>{option.dispText}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default TempModeDrawer;