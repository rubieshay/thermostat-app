import { useContext, useEffect, useState } from "react";
import { fanTimerOptions, getIsoDatePlusDuration, getFanTimerString, fanTimerDisplayUpdateInterval, isFanOn } from "../utils";
import { TempDataContext } from "../temp_data_context";
import { FanTimerMode } from "../types";

interface ModalDrawerProps {
    handleCloseModal: () => void
}

const FanTimerDrawer: React.FC<ModalDrawerProps> = ({ handleCloseModal }) => {
    const {selectedTempData: tempData, debounceTempData, setFanTimer} = useContext(TempDataContext);

    const [dispFanTimer, setDispFanTimer] = useState<string | null>(null);
    const [fanTimerString, setFanTimerString] = useState<string>("");
    const fanIsActive: boolean = isFanOn(tempData.fanTimer, tempData.hvacStatus);

    useEffect (() => {
        setDispFanTimer(tempData.fanTimer);
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
            setDispFanTimer(null);
            debounceTempData(() => setFanTimer(newFanMode), false);
        } else if (duration) {
            setDispFanTimer(getIsoDatePlusDuration(duration));
            debounceTempData(() => setFanTimer(newFanMode, duration), false);
        }
        handleCloseModal();
    }

    return (
        <div className="drawer-content">
            <h2>Fan</h2>
            <div className="icon-text-group">
                {fanIsActive ?
                    <span className="material-symbols material-symbols-rounded hvac-icon hvac-on">mode_fan</span>
                    :
                    <span className="material-symbols material-symbols-rounded hvac-icon hvac-off">mode_fan_off</span>
                }
                <span>{fanTimerString}</span>
            </div>
            <hr/>
            <ul className="button-select">
                <li className={dispFanTimer === null ? "button-option-disabled" : ""}>
                    <button onClick={() => changeFanTimer(FanTimerMode.off)}>Off</button>
                </li>
                {fanTimerOptions.map((option) => (
                    <li key={option.duration}>
                        <button className="icon-text-group" onClick={() => changeFanTimer(FanTimerMode.on, option.duration)}>
                            {option.dispText}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default FanTimerDrawer;