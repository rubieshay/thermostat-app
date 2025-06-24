import { useContext, type SetStateAction } from "react";
import { ModalDrawerType } from "../types";
import { TempDataContext } from "../contexts/temp_data_context";
import { ecoModeOptions } from "../utils/constants";

function EcoModeTile({ setModalDrawerType }: {setModalDrawerType: React.Dispatch<SetStateAction<ModalDrawerType | null>>}) {
    const {selectedTempData: tempData} = useContext(TempDataContext);

    return (
        <button className="tile" onClick={() => setModalDrawerType(ModalDrawerType.ecoModeModal)}>
            <h2>Eco Mode</h2>
            <div className="icon-text-group">
                <span className="material-symbols material-symbols-rounded" aria-hidden="true">
                    {ecoModeOptions.find((option) => option.ecoMode === tempData.ecoMode)?.symbolText}
                </span>
                <span>{ecoModeOptions.find((option) => option.ecoMode === tempData.ecoMode)?.displayText}</span>
            </div>
        </button>
    );
}

export default EcoModeTile;