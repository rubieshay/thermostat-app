import { useContext, type SetStateAction } from "react";
import { ModalDrawerType } from "../types";
import { TempDataContext } from "../temp_data_context";
import { ecoModeOptions } from "../utils";

interface TileProps {
    setModalDrawerType: React.Dispatch<SetStateAction<ModalDrawerType | null>>
}

const EcoModeTile: React.FC<TileProps> = ({ setModalDrawerType }) => {
    const {selectedTempData: tempData} = useContext(TempDataContext);

    return (
        <button className="tile" onClick={() => setModalDrawerType(ModalDrawerType.ecoModeModal)}>
            <h2>Eco Mode</h2>
            <div className="icon-text-group">
                <span className="material-symbols material-symbols-rounded">
                    {ecoModeOptions.find((option) => option.ecoMode === tempData.ecoMode)?.symbolText}
                </span>
                <span>{ecoModeOptions.find((option) => option.ecoMode === tempData.ecoMode)?.dispText}</span>
            </div>
        </button>
    );
}

export default EcoModeTile;