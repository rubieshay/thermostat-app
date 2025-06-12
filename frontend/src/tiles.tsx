import { useContext, useState, useEffect, type SetStateAction } from "react";
import { Connectivity, ModalDrawerType } from "./types";
import { TempDataContext } from "./temp_context";
import { getFanTimerString, isFanOn, tempModeOptions, ecoModeOptions, fanTimerDisplayUpdateInterval } from "./utils";

interface TileProps {
    setModalDrawer: React.Dispatch<SetStateAction<ModalDrawerType | null>>
}

const Tiles: React.FC<TileProps> = ({ setModalDrawer }) => {
    const {selectedTempData: tempData} = useContext(TempDataContext);
    const [fanTimerString, setFanTimerString] = useState<string>("");
    const fanIsActive: boolean = isFanOn(tempData.fanTimer, tempData.hvacStatus);

    // this should maybe use the same data as the modal timer
    useEffect (() => {
        // Calculate immediately
        setFanTimerString(getFanTimerString(tempData.fanTimer, tempData.hvacStatus));

        // Update every 15 seconds
        const interval = setInterval(() => {
            setFanTimerString(getFanTimerString(tempData.fanTimer, tempData.hvacStatus));
        }, fanTimerDisplayUpdateInterval);

        return () => clearInterval(interval);

    }, [tempData.fanTimer, tempData.hvacStatus]);

    function handleSetModalDrawer(drawerType: ModalDrawerType) {
        // handleResetModal(false);
        setModalDrawer(drawerType);
    }

    return (
        <section id="info">
            {tempData.connectivity === Connectivity.online ?
                <>
                    <button className="tile" onClick={() => handleSetModalDrawer(ModalDrawerType.tempModeModal)}>
                        <h2>Temperature Mode</h2>
                        <div className="current-tile-selection">
                            <span className="material-symbols material-symbols-rounded">
                                {tempModeOptions.find((option) => option.tempMode === tempData.tempMode)?.symbolText}
                            </span>
                            <span>{tempModeOptions.find((option) => option.tempMode === tempData.tempMode)?.dispText}</span>
                        </div>
                    </button>
                    <button className="tile" onClick={() => handleSetModalDrawer(ModalDrawerType.ecoModeModal)}>
                        <h2>Eco Mode</h2>
                        <div className="current-tile-selection">
                            <span className="material-symbols material-symbols-rounded">
                                {ecoModeOptions.find((option) => option.ecoMode === tempData.ecoMode)?.symbolText}
                            </span>
                            <span>{ecoModeOptions.find((option) => option.ecoMode === tempData.ecoMode)?.dispText}</span>
                        </div>
                    </button>
                    <button className="tile" onClick={() => handleSetModalDrawer(ModalDrawerType.fanTimerModal)}>
                        <h2>Fan</h2>
                        <div className="current-tile-selection">
                            {fanIsActive ?
                                <span className="material-symbols material-symbols-rounded hvac-icon hvac-on">mode_fan</span>
                                :
                                <span className="material-symbols material-symbols-rounded hvac-icon hvac-off">mode_fan_off</span>
                            }
                            <span>{fanTimerString}</span>
                        </div>
                    </button>
                </>
                :
                <></>
            }
        </section>
    )
}

export default Tiles;