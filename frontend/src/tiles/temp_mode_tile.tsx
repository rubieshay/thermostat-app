import { useContext, type SetStateAction } from "react";
import { ModalDrawerType } from "../types";
import { TempDataContext } from "../contexts/temp_data_context";
import { tempModeOptions } from "../utils/constants";

function TempModeTile({ setModalDrawerType }: {
    setModalDrawerType: React.Dispatch<SetStateAction<ModalDrawerType | null>>}) {
    const {selectedTempData: tempData} = useContext(TempDataContext);

    return (
        <button className="tile" onClick={() => setModalDrawerType(ModalDrawerType.tempModeModal)}>
            <h2>HVAC Mode</h2>
            <div className="icon-text-group">
                <span className="material-symbols material-symbols-rounded" aria-hidden="true">
                    {tempModeOptions.find((option) => option.tempMode === tempData.tempMode)?.symbolText}
                </span>
                <span>{tempModeOptions.find((option) => option.tempMode === tempData.tempMode)?.displayText}</span>
            </div>
        </button>
    );
}

export default TempModeTile;