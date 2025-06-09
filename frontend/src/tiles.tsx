import { useContext, useState, useEffect } from "react";
import { Connectivity, TempMode, EcoMode, FanTimerMode } from "./types";
import { TempDataContext } from "./temp_context";
import { getFanTimerString, getIsoDatePlusDuration } from "./utils";

function Tiles() {
    const {selectedTempData: tempData, debounceTempData, setTempMode, setEcoMode, setFanTimer} = useContext(TempDataContext);
    const [dispTempMode, setDispTempMode] = useState<TempMode>(TempMode.off);
    const [dispEcoMode, setDispEcoMode] = useState<EcoMode>(EcoMode.off);
    const [dispFanTimer, setDispFanTimer] = useState<string | null>(null);
    const [fanTimerString, setFanTimerString] = useState<string>("");

    useEffect (() => {
        setDispTempMode(tempData.tempMode);
    }, [tempData.tempMode]);

    useEffect (() => {
        setDispEcoMode(tempData.ecoMode);
    }, [tempData.ecoMode]);


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

    function changeTempMode(event: React.ChangeEvent<HTMLInputElement>) {
        // const newTempMode: TempMode = TempMode[event.target.value as keyof typeof TempMode];
        const newTempMode = event.target.value as TempMode;
        setDispTempMode(newTempMode);
        debounceTempData(() => setTempMode(newTempMode));
    }

    function changeEcoMode(event: React.ChangeEvent<HTMLInputElement>) {
        // const newEcoMode: EcoMode = EcoMode[event.target.value as keyof typeof EcoMode];
        const newEcoMode = event.target.value as EcoMode;
        setDispEcoMode(newEcoMode);
        debounceTempData(() => setEcoMode(newEcoMode));
    }

    function changeFanTimer(newFanMode: FanTimerMode, duration?: number) {
        // const newEcoMode: EcoMode = EcoMode[event.target.value as keyof typeof EcoMode];
        if (newFanMode === FanTimerMode.off) {
            setDispFanTimer(null);
            debounceTempData(() => setFanTimer(newFanMode));
        } else if (duration) {
            setDispFanTimer(getIsoDatePlusDuration(duration));
            debounceTempData(() => setFanTimer(newFanMode, duration));
        }
    }

    const tempModeOptions = [{"value": TempMode.heat, "IdText": "heat",
                                "dispText": "Heat", "symbolText": "heat"},
                             {"value": TempMode.cool, "IdText": "cool",
                                "dispText": "Cool", "symbolText": "mode_dual"},
                             {"value": TempMode.heatcool, "IdText": "heatcool",
                                "dispText": "Heat • Cool", "symbolText": "mode_cool"},
                             {"value": TempMode.off, "IdText": "off",
                                "dispText": "Off", "symbolText": "mode_off_on"}]
    const ecoModeOptions = [{"value": EcoMode.on, "IdText": "on",
                                "dispText": "On", "symbolText": "nest_eco_leaf"},
                            {"value": TempMode.off, "IdText": "off",
                                "dispText": "Off", "symbolText": "thermostat"}]
    const fanTimerOptions = [{"duration": 900, "dispText": "15 min"},
                             {"duration": 1800, "dispText": "30 min"},
                             {"duration": 2700, "dispText": "45 min"},
                             {"duration": 3600, "dispText": "1 hr"},
                             {"duration": 7200, "dispText": "2 hr"},
                             {"duration": 14400, "dispText": "4 hr"},
                             {"duration": 28800, "dispText": "8 hr"},
                             {"duration": 43200, "dispText": "12 hr"}]

    return (
        <section id="info">
            {tempData.connectivity === Connectivity.online ?
                <>
                    <div className="tile">
                        <fieldset className="radio-select">
                            <legend><h2>Temp Mode:</h2></legend>
                            <ul>
                                {tempModeOptions.map((option) => (
                                    <li key={option.value}>
                                        <input id={"temp-mode-select-" + option.IdText}
                                               name="temp-mode-select" type="radio" value={option.value}
                                               checked={dispTempMode === option.value}
                                               onChange={(event) => changeTempMode(event)}>
                                        </input>
                                        <label htmlFor={"temp-mode-select-" + option.IdText}>
                                            <span className="material-symbols material-symbols-rounded">
                                                {option.symbolText}
                                            </span>
                                            <span>{option.dispText}</span>
                                        </label>
                                    </li>
                                ))}
                            </ul>
                        </fieldset>
                    </div>
                    <div className="tile">
                        <fieldset className="radio-select">
                            <legend><h2>Eco Mode:</h2></legend>
                            <ul>
                                {ecoModeOptions.map((option) => (
                                    <li key={option.value}>
                                        <input id={"eco-mode-select-" + option.IdText}
                                               name="eco-mode-select" type="radio" value={option.value}
                                               checked={dispEcoMode === option.value}
                                               onChange={(event) => changeEcoMode(event)}>
                                        </input>
                                        <label htmlFor={"eco-mode-select-" + option.IdText}>
                                            <span className="material-symbols material-symbols-rounded">
                                                {option.symbolText}
                                            </span>
                                            <span>{option.dispText}</span>
                                        </label>
                                    </li>
                                ))}
                            </ul>
                        </fieldset>
                    </div>
                    <div className="tile">
                        <h2>Current Fan Timer:</h2>
                        <div>{fanTimerString}</div>
                        <hr></hr>
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
                    <div className="tile">
                        <h2>HVAC Status:</h2>
                        <div>{tempData.hvacStatus}</div>
                    </div>
                </>
                :
                <></>
            }
        </section>
    )
}

export default Tiles;