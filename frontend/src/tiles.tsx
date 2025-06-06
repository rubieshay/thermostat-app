import { useContext, useEffect } from "react";
import { Connectivity, TempMode } from "./types";
import { TempDataContext } from "./temp_context";

function Tiles() {
    const {getSelectedTempData, fetchTempData, setTempMode} = useContext(TempDataContext);

    useEffect(() => {
        fetchTempData();
    }, []);

    const tempData = getSelectedTempData();

    // function {
    //     if (debounceTimeoutRef.current) {
    //         clearTimeout(debounceTimeoutRef.current);
    //     }
    //     debounceTimeoutRef.current = setTimeout(() => {
    //         if (tempData.tempMode === TempMode.heat) {
    //             setHeatCelsius(celsiusFixedTemp);
    //             console.log("call set heat");
    //         } else if (tempData.tempMode === TempMode.cool) {
    //             setCoolCelsius(celsiusFixedTemp);
    //             console.log("call set cool");
    //         }
    //     }, debounceTime);
    // }

    return (
        <section id="info">
            {tempData.connectivity === Connectivity.online ?
                <>
                    <div className="tile">
                        <fieldset className="radio-select">
                            <legend><h2>Temp Mode:</h2></legend>
                            <div className="radio-options">
                                <div className="radio-option">
                                    <input id="temp-mode-select-heat" name="temp-mode-select" type="radio"
                                        value={TempMode.heat} onChange={() => setTempMode(TempMode.heat)}></input>
                                    <label htmlFor="temp-mode-select-heat">Heat Mode</label>
                                </div>
                                <div className="radio-option">
                                    <input id="temp-mode-select-heatcool" name="temp-mode-select" type="radio"
                                        value={TempMode.heatcool} onChange={() => setTempMode(TempMode.heatcool)}></input>
                                    <label htmlFor="temp-mode-select-heatcool">Heat-Cool Mode</label>
                                </div>
                                <div className="radio-option">
                                    <input id="temp-mode-select-cool" name="temp-mode-select" type="radio"
                                        value={TempMode.cool} onChange={() => setTempMode(TempMode.cool)}></input>
                                    <label htmlFor="temp-mode-select-cool">Cool Mode</label>
                                </div>
                                <div className="radio-option">
                                    <input id="temp-mode-select-off" name="temp-mode-select" type="radio"
                                        value={TempMode.heat} onChange={() => setTempMode(TempMode.off)}></input>
                                    <label htmlFor="temp-mode-select-off">Off</label>
                                </div>
                            </div>
                        </fieldset>
                    </div>
                    <div className="tile">HVAC Status: {tempData.hvacStatus}</div>
                    <div className="tile">Fan Timer: {String(tempData.fanTimer)}</div>
                </>
                :
                <></>
            }
        </section>
    )
}

export default Tiles;