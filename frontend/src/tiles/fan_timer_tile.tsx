import { useContext, useState, useEffect, type SetStateAction } from "react";
import { ModalDrawerType } from "../types";
import { TempDataContext } from "../contexts/temp_data_context";
import { fanTimerDisplayUpdateInterval } from "../utils/constants";
import { getFanTimerString, isFanOn } from "../utils/functions";

function FanTimerTile({ setModalDrawerType }: {setModalDrawerType: React.Dispatch<SetStateAction<ModalDrawerType | null>>}) {
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
                    <span className="material-symbols material-symbols-rounded fan-icon fan-on" aria-hidden="true">
                        {"\uf168"}
                    </span>
                    :
                    <span className="material-symbols material-symbols-rounded fan-icon fan-off" aria-hidden="true">
                        {"\uec17"}
                    </span>
                }
                <span>{fanTimerString}</span>
            </div>
        </button>
    );
}

export default FanTimerTile;