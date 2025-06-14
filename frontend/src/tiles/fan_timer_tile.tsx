import { useContext, useState, useEffect, type SetStateAction } from "react";
import { ModalDrawerType } from "../types";
import { TempDataContext } from "../temp_data_context";
import { getFanTimerString, isFanOn, fanTimerDisplayUpdateInterval } from "../utils";

interface TileProps {
    setModalDrawerType: React.Dispatch<SetStateAction<ModalDrawerType | null>>
}

const FanTimerTile: React.FC<TileProps> = ({ setModalDrawerType }) => {
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

    return (
        <button className="tile" onClick={() => setModalDrawerType(ModalDrawerType.fanTimerModal)}>
            <h2>Fan</h2>
            <div className="icon-text-group">
                {fanIsActive ?
                    <span className="material-symbols material-symbols-rounded hvac-icon hvac-on">mode_fan</span>
                    :
                    <span className="material-symbols material-symbols-rounded hvac-icon hvac-off">mode_fan_off</span>
                }
                <span>{fanTimerString}</span>
            </div>
        </button>
    );
}

export default FanTimerTile;