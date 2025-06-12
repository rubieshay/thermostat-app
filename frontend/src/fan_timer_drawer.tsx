import { useContext, useEffect, useState } from "react";
import { fanTimerOptions, getIsoDatePlusDuration, getFanTimerString } from "./utils";
import { TempDataContext } from "./temp_context";
import { FanTimerMode } from "./types";

function FanTimerDrawer() {
    const {selectedTempData: tempData, debounceTempData, setFanTimer} = useContext(TempDataContext);

    const [dispFanTimer, setDispFanTimer] = useState<string | null>(null);
    const [fanTimerString, setFanTimerString] = useState<string>("");

    useEffect (() => {
        setDispFanTimer(tempData.fanTimer);
        // Calculate immediately
        setFanTimerString(getFanTimerString(tempData.fanTimer, tempData.hvacStatus));

        // Update every 15 seconds
        const interval = setInterval(() => {
            setFanTimerString(getFanTimerString(tempData.fanTimer, tempData.hvacStatus));
        }, 15000);

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
    }

    return (
        <div className="drawer-content">
            <h2>Current Fan Timer:</h2>
            <div>{fanTimerString}</div>
            <hr/>
            <ul className="button-select">
                <li className={dispFanTimer === null ? "button-option-disabled" : ""}>
                    <button onClick={() => changeFanTimer(FanTimerMode.off)}>Off</button>
                </li>
                {fanTimerOptions.map((option) => (
                    <li key={option.duration}>
                        <button onClick={() => changeFanTimer(FanTimerMode.on, option.duration)}>
                            {option.dispText}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default FanTimerDrawer;