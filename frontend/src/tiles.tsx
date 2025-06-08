import { useContext, useState, useEffect } from "react";
import { Connectivity, TempMode, EcoMode } from "./types";
import { TempDataContext } from "./temp_context";

function Tiles() {
    const {selectedTempData: tempData, debounceTempData, setTempMode, setEcoMode} = useContext(TempDataContext);
    const [dispTempMode, setDispTempMode] = useState<TempMode>(TempMode.off);
    const [dispEcoMode, setDispEcoMode] = useState<EcoMode>(EcoMode.off);

    useEffect (() => {
        setDispTempMode(tempData.tempMode);
    }, [tempData.tempMode]);

    useEffect (() => {
        setDispEcoMode(tempData.ecoMode);
    }, [tempData.ecoMode]);

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
                                        value={TempMode.heat} checked={dispTempMode === TempMode.heat}
                                        onChange={(event) => changeTempMode(event)}></input>
                                    <label htmlFor="temp-mode-select-heat">
                                        <span className="material-symbols material-symbols-rounded">heat</span>
                                        <span>Heat</span>
                                    </label>
                                </div>
                                <div className="radio-option">
                                    <input id="temp-mode-select-heatcool" name="temp-mode-select" type="radio"
                                        value={TempMode.heatcool} checked={dispTempMode === TempMode.heatcool}
                                        onChange={(event) => changeTempMode(event)}></input>
                                    <label htmlFor="temp-mode-select-heatcool">
                                        <span className="material-symbols material-symbols-rounded">mode_dual</span>
                                        <span>Heat • Cool</span>
                                    </label>
                                </div>
                                <div className="radio-option">
                                    <input id="temp-mode-select-cool" name="temp-mode-select" type="radio"
                                        value={TempMode.cool} checked={dispTempMode === TempMode.cool}
                                        onChange={(event) => changeTempMode(event)}></input>
                                    <label htmlFor="temp-mode-select-cool">
                                        <span className="material-symbols material-symbols-rounded">mode_cool</span>
                                        <span>Cool</span>
                                    </label>
                                </div>
                                <div className="radio-option">
                                    <input id="temp-mode-select-off" name="temp-mode-select" type="radio"
                                        value={TempMode.off} checked={dispTempMode === TempMode.off}
                                        onChange={(event) => changeTempMode(event)}></input>
                                    <label htmlFor="temp-mode-select-off">
                                        <span className="material-symbols material-symbols-rounded">mode_off_on</span>
                                        <span>Off</span>
                                    </label>
                                </div>
                            </div>
                        </fieldset>
                    </div>
                    <div className="tile">
                        <fieldset className="radio-select">
                            <legend><h2>Eco Mode:</h2></legend>
                            <div className="radio-options">
                                <div className="radio-option">
                                    <input id="eco-mode-select-off" name="eco-mode-select" type="radio"
                                        value={EcoMode.off} checked={dispEcoMode === EcoMode.off}
                                        onChange={(event) => changeEcoMode(event)}></input>
                                    <label htmlFor="eco-mode-select-off">
                                        <span className="material-symbols material-symbols-rounded">thermostat</span>
                                        <span>Normal</span>
                                    </label>
                                </div>
                                <div className="radio-option">
                                    <input id="eco-mode-select-on" name="eco-mode-select" type="radio"
                                        value={EcoMode.on} checked={dispEcoMode === EcoMode.on}
                                        onChange={(event) => changeEcoMode(event)}></input>
                                    <label htmlFor="eco-mode-select-on">
                                        <span className="material-symbols material-symbols-rounded">nest_eco_leaf</span>
                                        <span>Eco</span>
                                    </label>
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