import { useContext, useEffect, useState } from "react";
import { fanTimerOptions, fanTimerDisplayUpdateInterval } from "../utils/constants";
import { getIsoDatePlusDuration, getFanTimerString, isFanOn } from "../utils/functions";
import { TempDataContext } from "../contexts/temp_data_context";
import { FanTimerMode } from "../types";

function FanTimerDrawer({ handleCloseModal }: {handleCloseModal: () => void}) {
    const {selectedTempData: tempData, debounceTempData, setFanTimer} = useContext(TempDataContext);

    const [currFanTimer, setCurrFanTimer] = useState<string | null>(null);
    const [fanTimerString, setFanTimerString] = useState<string>("");
    const fanIsActive: boolean = isFanOn(tempData.fanTimer, tempData.hvacStatus);

    useEffect (() => {
        setCurrFanTimer(tempData.fanTimer);
        // Calculate immediately
        setFanTimerString(getFanTimerString(tempData.fanTimer, tempData.hvacStatus));

        // Update every 15 seconds
        const interval = setInterval(() => {
            setFanTimerString(getFanTimerString(tempData.fanTimer, tempData.hvacStatus));
        }, fanTimerDisplayUpdateInterval);

        return () => clearInterval(interval);

    }, [tempData.fanTimer, tempData.hvacStatus]);

    function changeFanTimer(newFanMode: FanTimerMode, duration?: number) {
        if (newFanMode === FanTimerMode.off) {
            setCurrFanTimer(null);
            debounceTempData(() => setFanTimer(newFanMode), false);
        } else if (duration) {
            setCurrFanTimer(getIsoDatePlusDuration(duration));
            debounceTempData(() => setFanTimer(newFanMode, duration), false);
        }
        handleCloseModal();
    }

    return (
        <div className="drawer-content">
            <div>
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
            </div>
            <ul className="button-select">
                {fanTimerOptions.map((option) => (
                    <li key={option.duration}>
                        <button className="standard-button" onClick={() => changeFanTimer(FanTimerMode.on, option.duration)}>
                            {option.displayText}
                        </button>
                    </li>
                ))}
                <li className="extra-select-option">
                    <button className={"standard-button" + (currFanTimer === null ? " button-disabled" : "")}
                    onClick={() => changeFanTimer(FanTimerMode.off)}>End Timer</button>
                </li>
            </ul>
        </div>
    );
}

export default FanTimerDrawer;