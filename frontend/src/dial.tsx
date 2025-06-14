import { useEffect, useState, useContext, useRef, useCallback } from "react";
import { TempUnits, TempMode, EcoMode, HvacStatus, Connectivity, SetPointType } from "./types";
import { roundedTemp, convertTemp, maxDialTemps, minDialTemps, usedDialRatio, decimalPrecision, minRangeGap, makeTempInRange, setPointFadeDuration, isFanOn } from "./utils";
import { TempDataContext } from "./temp_data_context";

function Dial() {
    const {selectedTempData: tempData, debounceTempData, setHeatCelsius, setCoolCelsius, setRangeCelsius} = useContext(TempDataContext);
    // we need to possibly schange dispTemps to not be rounded for better dragging, but only display numbers as rounded at set numbers as rounded and maybe create roundedDispTemps (also could split into decimal component for superscript-like decimals)
    const [dispCoolPoint, setDispCoolPoint] = useState<number | null>(null);
    const [dispHeatPoint, setDispHeatPoint] = useState<number | null>(null);
    const [activeSetPoint, setActiveSetPoint] = useState<SetPointType | null>(null);
    const [lastSetPoint, setLastSetPoint] = useState<SetPointType | null>(null);
    const [isDraggingTemp, setIsDraggingTemp] = useState<boolean>(false);
    const setPointFadeTimer = useRef<number | null>(null);
    const dialRef = useRef<HTMLElement | null>(null);

    const dispAmbientTemp: number | null = roundedTemp(convertTemp(tempData.ambientTempCelsius, TempUnits.celsius, tempData.tempUnits), tempData.tempUnits);
    const fanIsActive: boolean = isFanOn(tempData.fanTimer, tempData.hvacStatus);

    const maxDialTemp: number = maxDialTemps[tempData.tempUnits];
    const minDialTemp: number = minDialTemps[tempData.tempUnits];
    const midDialTemp: number = (maxDialTemp + minDialTemp) / 2;
    const dialRange: number = maxDialTemp - minDialTemp;

    const ambientThumbAngle: number | null = getThumbAngle(dispAmbientTemp);
    const coolPointThumbAngle: number | null = getThumbAngle(dispCoolPoint);
    const heatPointThumbAngle: number | null = getThumbAngle(dispHeatPoint);
    const activeTrackRange: number[] = getTrackRange();

    useEffect(() => {
        setActiveSetPoint(null);
        if (tempData.tempMode === TempMode.cool) {
            setLastSetPoint(SetPointType.cool);
        } else if (tempData.tempMode === TempMode.heat) {
            setLastSetPoint(SetPointType.heat);
        }
    }, [tempData.tempMode]);

    useEffect(() => {
        let baseTemp = null;
        if (tempData.tempMode === TempMode.cool || tempData.tempMode === TempMode.heatcool) {
            if (tempData.ecoMode === EcoMode.on) {
                baseTemp = tempData.ecoCoolCelsius;
            } else {
                baseTemp = tempData.coolCelsius;
            }
        }
        const unitTemp = convertTemp(baseTemp, TempUnits.celsius, tempData.tempUnits);
        setDispCoolPoint(roundedTemp(unitTemp, tempData.tempUnits));
    }, [tempData.ecoCoolCelsius, tempData.coolCelsius, tempData.tempUnits, tempData.tempMode, tempData.ecoMode]);

    useEffect(() => {
        let baseTemp = null;
        if (tempData.tempMode === TempMode.heat || tempData.tempMode === TempMode.heatcool) {
            if (tempData.ecoMode === EcoMode.on) {
                baseTemp = tempData.ecoHeatCelsius;
            } else {
                baseTemp = tempData.heatCelsius;
            }
        }
        const unitTemp = convertTemp(baseTemp, TempUnits.celsius, tempData.tempUnits);
        setDispHeatPoint(roundedTemp(unitTemp, tempData.tempUnits));
    }, [tempData.ecoHeatCelsius, tempData.heatCelsius, tempData.tempUnits, tempData.tempMode, tempData.ecoMode]);

    // SWAPPING AND FADING SETPOINTS

    const fadeSetPoint = useCallback((startFade: boolean) => {
        if (setPointFadeTimer.current) {
            clearTimeout(setPointFadeTimer.current);
        }
        if (startFade) {
            setPointFadeTimer.current = window.setTimeout(() => {
                setActiveSetPoint(null);
            }, setPointFadeDuration);
        }
    }, []);

    const changeActiveSetpoint = useCallback((setPointType: SetPointType | null, startFade: boolean) => {
        setActiveSetPoint(setPointType);
        if (setPointType !== null) {
            setLastSetPoint(setPointType);
        }
        fadeSetPoint(startFade);
    }, [fadeSetPoint]);

    // SETTING/CHANGING TEMP SETPOINTS

    const changeSingleTemp = useCallback((newTemp: number, setPointType: SetPointType) => {
        const fixedTemp = makeTempInRange(newTemp, tempData.tempUnits);
        if (setPointType === SetPointType.heat && tempData.tempMode === TempMode.heat) {
            setDispHeatPoint(roundedTemp(fixedTemp, tempData.tempUnits));
        } else if (setPointType === SetPointType.cool && tempData.tempMode === TempMode.cool) {
            setDispCoolPoint(roundedTemp(fixedTemp, tempData.tempUnits));
        }
        // fix then round then convert
        const celsiusFixedTemp: number | null = convertTemp(roundedTemp(fixedTemp, tempData.tempUnits), tempData.tempUnits, TempUnits.celsius);

        if (celsiusFixedTemp === null) {
            return;
        }
        if (tempData.tempMode === TempMode.heat) {
            debounceTempData(() => setHeatCelsius(celsiusFixedTemp), true);
        } else if (tempData.tempMode === TempMode.cool) {
            debounceTempData(() => setCoolCelsius(celsiusFixedTemp), true);
        }
    }, [debounceTempData, setCoolCelsius, setHeatCelsius, tempData.tempMode, tempData.tempUnits]);

    const changeRangeTemps = useCallback((newTemp: number, setPointType: SetPointType) => {
        if (dispHeatPoint === null || dispCoolPoint === null) {
            return;
        }
        // get both temps fixed(range) and rounded but not converted
        let heatPoint;
        let coolPoint;
        if (setPointType === SetPointType.heat) {
            heatPoint = newTemp;
            coolPoint = dispCoolPoint
        } else {
            heatPoint = dispHeatPoint;
            coolPoint = newTemp;
        }
        heatPoint = roundedTemp(makeTempInRange(heatPoint, tempData.tempUnits), tempData.tempUnits);
        coolPoint = roundedTemp(makeTempInRange(coolPoint, tempData.tempUnits), tempData.tempUnits);
        let newHeatPoint = heatPoint;
        let newCoolPoint = coolPoint;
        // ensure a large enough gap
        if (coolPoint! - heatPoint! < minRangeGap[tempData.tempUnits]) {
            if (setPointType === SetPointType.heat) {
                newCoolPoint = (heatPoint! + minRangeGap[tempData.tempUnits]);
                if (newCoolPoint > maxDialTemp) {
                    newCoolPoint = maxDialTemp;
                    newHeatPoint = maxDialTemp - minRangeGap[tempData.tempUnits];
                }
            } else {
                newHeatPoint = (coolPoint! - minRangeGap[tempData.tempUnits]);
                if (newHeatPoint < minDialTemp) {
                    newHeatPoint = minDialTemp;
                    newCoolPoint = minDialTemp + minRangeGap[tempData.tempUnits];
                }
            }
        }
        // set disp points
        setDispHeatPoint(newHeatPoint);
        setDispCoolPoint(newCoolPoint);
        // convert to C and send calls
        const heatCelsiusFixedTemp = convertTemp(newHeatPoint, tempData.tempUnits, TempUnits.celsius);
        const coolCelsiusFixedTemp = convertTemp(newCoolPoint, tempData.tempUnits, TempUnits.celsius);
        if (heatCelsiusFixedTemp === null || coolCelsiusFixedTemp === null) {
            return;
        }
        debounceTempData(() => setRangeCelsius(heatCelsiusFixedTemp, coolCelsiusFixedTemp), true);
    }, [debounceTempData, dispCoolPoint, dispHeatPoint, maxDialTemp, minDialTemp, setRangeCelsius, tempData.tempUnits]);

    const changeTemp = useCallback((newTemp: number, setPointType: SetPointType) => {
        if (tempData.tempMode === TempMode.off || tempData.ecoMode === EcoMode.on) {
            return;
        } else if (tempData.tempMode === TempMode.heatcool) {
            changeRangeTemps(newTemp, setPointType);
        } else {
            changeSingleTemp(newTemp, setPointType);
        }
        fadeSetPoint(true);
    }, [changeRangeTemps, changeSingleTemp, tempData.ecoMode, tempData.tempMode, fadeSetPoint]);

    function bumpTemp(diff: number) {
        // determine which setpoint to bump, and make active if needed
        let thisSetPoint = activeSetPoint;
        // if no last set point, choose based on the tempMode or button pressed if heatcool
        if (lastSetPoint === null) {
            if (tempData.tempMode === TempMode.heat || (tempData.tempMode === TempMode.heatcool && diff > 0)) {
                changeActiveSetpoint(SetPointType.heat, true);
                thisSetPoint = SetPointType.heat;
            } else {
                changeActiveSetpoint(SetPointType.cool, true);
                thisSetPoint = SetPointType.cool;
            }
        } else if (activeSetPoint === null) {
            setActiveSetPoint(lastSetPoint);
            thisSetPoint = lastSetPoint;
        }
        // change corresponding setpoint
        let newTemp: number;
        if (thisSetPoint === SetPointType.cool) {
            if (dispCoolPoint === null) {
                return;
            } else {
                newTemp = dispCoolPoint + diff;
            }
        } else if (thisSetPoint === SetPointType.heat) {
            if (dispHeatPoint === null) {
                return;
            } else {
                newTemp = dispHeatPoint + diff;
            }
        } else {
            return;
        }
        changeTemp(newTemp, thisSetPoint);
    }

    // DRAGGING TEMP SETPOINTS

    const dragTemp = useCallback((event: PointerEvent) => {
        if (activeSetPoint === null) {
            return;
        }
        const dialBoundingRect = dialRef.current?.getBoundingClientRect();
        if (dialBoundingRect === undefined) {
            return;
        }
        // get the center of dial X and Y
        const centerX = ((dialBoundingRect.right - dialBoundingRect.left) / 2) + dialBoundingRect.left;
        const centerY = ((dialBoundingRect.bottom - dialBoundingRect.top) / 2) + dialBoundingRect.top;
        // find the angle with trig
        const dx = event.clientX - centerX;
        const dy = event.clientY - centerY;
        const angleRadians = Math.atan2(dy, dx);
        // get temperature based on angle
        let angleFraction = ((angleRadians + (Math.PI/2)) / (2*Math.PI));
        if (angleFraction > 0.5) {
            angleFraction -= 1;
        } else if (angleFraction < -0.5) {
            angleFraction += 1;
        }
        const newTemp = ((dialRange / usedDialRatio) * angleFraction) + midDialTemp;
        changeTemp(newTemp, activeSetPoint);
    }, [activeSetPoint, changeTemp, dialRange, midDialTemp]);

    const finishDragTemp = useCallback(() => {
        setIsDraggingTemp(false);
        fadeSetPoint(true);
    }, [fadeSetPoint]);

    const startDragTemp = useCallback((setPointType: SetPointType) => {
        // make setpoint active if needed but don't fade until pointerUp
        changeActiveSetpoint(setPointType, false);
        setIsDraggingTemp(true);
    }, [changeActiveSetpoint]);
    
    useEffect(() => {
        if (isDraggingTemp) {
            window.addEventListener("pointermove", dragTemp);
            window.addEventListener("pointerup", finishDragTemp);
        }

        return (() => {
            window.removeEventListener("pointermove", dragTemp);
            window.removeEventListener("pointerup", finishDragTemp);
        });

    }, [isDraggingTemp, dispCoolPoint, dispHeatPoint, dragTemp, finishDragTemp]);

    // DIALS AND THUMBS

    function getThumbAngle(thumbTemp: number | null): number | null {
        if (thumbTemp === null) {
            return null;
        }
        return (thumbTemp - midDialTemp) / (dialRange / usedDialRatio);
    }

    function getTrackRange(): number[] {
        // if mode is off, set both to 0 (no active range)
        let startRange: number = 0; 
        let endRange: number = 0;
        // if mode is heat, go from heat to high
        if (tempData.tempMode === TempMode.heat && heatPointThumbAngle !== null) {
            startRange = heatPointThumbAngle;
            endRange = usedDialRatio / 2;
        // if mode is cool, go from low to cool
        } else if (tempData.tempMode === TempMode.cool && coolPointThumbAngle !== null) {
            startRange = -usedDialRatio / 2;
            endRange = coolPointThumbAngle;
        // if mode is heatcool, go from heat to cool
        } else if (tempData.tempMode === TempMode.heatcool && heatPointThumbAngle !== null && coolPointThumbAngle !== null) {
            startRange = heatPointThumbAngle;
            endRange = coolPointThumbAngle;
        }
        return [startRange, endRange];
    }

    return (
        <section id="dial" ref={dialRef}
            className={(tempData && tempData.connectivity === Connectivity.online &&
            tempData.hvacStatus !== HvacStatus.off) ?
            (tempData.hvacStatus === HvacStatus.cooling ? "hvac-status-cooling" :
            (tempData.hvacStatus === HvacStatus.heating ? "hvac-status-heating" : "")) : ""}>
            {tempData.connectivity === Connectivity.online ?
                <>
                    {/* DIAL TRACK */}
                    <div className="dial-track"
                        style={{"--used-dial-ratio": usedDialRatio + "turn",
                        "--start-thumb": activeTrackRange[0] + "turn",
                        "--end-thumb": activeTrackRange[1] + "turn"} as React.CSSProperties}>
                    </div>
                    <div className={"track-cap track-cap-active track-cap-active-start" + (tempData.tempMode === TempMode.off ? " track-cap-active-off" : "")} aria-hidden="true"
                        style={{"--cap-active-start-angle": activeTrackRange[0] + "turn"} as React.CSSProperties}>
                    </div>
                    <div className={"track-cap track-cap-active track-cap-active-end" + (tempData.tempMode === TempMode.off ? " track-cap-active-off" : "")} aria-hidden="true"
                        style={{"--cap-active-end-angle": activeTrackRange[1] + "turn"} as React.CSSProperties}>
                    </div>
                    <div className="track-cap track-cap-outer" aria-hidden="true"
                        style={{"--cap-angle": -usedDialRatio/2 + "turn"} as React.CSSProperties}>
                    </div>
                    <div className="track-cap track-cap-outer" aria-hidden="true"
                        style={{"--cap-angle": usedDialRatio/2 + "turn"} as React.CSSProperties}>
                    </div>
                    <div className="track-cover" aria-hidden="true"></div>
                    {/* DIAL THUMBS */}
                    <div id="ambient-thumb-container" className="dial-thumb-container"
                        style={{"--thumb-angle": ambientThumbAngle + "turn"} as React.CSSProperties}>
                        <div className="dial-thumb"></div>
                    </div>
                    {tempData.tempMode === TempMode.heat || tempData.tempMode === TempMode.heatcool ?
                        <div id="heatpoint-thumb-container" className="dial-thumb-container"
                            style={{"--thumb-angle": heatPointThumbAngle + "turn"} as React.CSSProperties}>
                            <div className={"dial-thumb setpoint-thumb" +
                                (activeSetPoint === SetPointType.heat && isDraggingTemp ? " setpoint-thumb-active": "")}
                                onPointerDown={() => startDragTemp(SetPointType.heat)}>
                            </div>
                        </div>
                        :
                        <></>
                    }
                    {tempData.tempMode === TempMode.cool || tempData.tempMode === TempMode.heatcool ?
                        <div id="coolpoint-thumb-container" className="dial-thumb-container"
                            style={{"--thumb-angle": coolPointThumbAngle + "turn"} as React.CSSProperties}>
                            <div className={"dial-thumb setpoint-thumb" +
                                (activeSetPoint === SetPointType.cool && isDraggingTemp ? " setpoint-thumb-active": "")}
                                onPointerDown={() => startDragTemp(SetPointType.cool)}>
                            </div>
                        </div>
                        :
                        <></>
                    }
                    {/* CENTER NUMBERS */}
                    <div id="main-numbers">
                        <div id="main-numbers-ambient" className="main-number-group">
                            <h2>Indoor</h2>
                            <h3>{(typeof dispAmbientTemp === "number") && !isNaN(dispAmbientTemp) ? dispAmbientTemp : ""}</h3>
                        </div>
                        {tempData.tempMode === TempMode.off ?
                            <></>
                            :
                            <div id="main-numbers-setpoints">
                                {tempData.tempMode === TempMode.heat || tempData.tempMode === TempMode.heatcool ?
                                    <button id="main-numbers-heatpoint" className={"main-number-group" + (activeSetPoint === SetPointType.heat ? " setpoint-number-active" : "")} onClick={() => changeActiveSetpoint(SetPointType.heat, true)}>
                                        <h2>Heat</h2>
                                        <h3>{(typeof dispHeatPoint === "number") && !isNaN(dispHeatPoint) ? dispHeatPoint : ""}</h3>
                                    </button>
                                    :
                                    <></>
                                }
                                {tempData.tempMode === TempMode.cool || tempData.tempMode === TempMode.heatcool ?
                                    <button id="main-numbers-coolpoint" className={"main-number-group" + (activeSetPoint === SetPointType.cool ? " setpoint-number-active" : "")} onClick={() => changeActiveSetpoint(SetPointType.cool, true)}>
                                        <h2>Cool</h2>
                                        <h3>{(typeof dispCoolPoint === "number") && !isNaN(dispCoolPoint) ? dispCoolPoint : ""}</h3>
                                    </button>
                                    :
                                    <></>
                                }
                            </div>
                        }
                    </div>

                    {/* PLUS/MINUS BUTTONS AND BOTTOM SYMBOLS */}
                    {fanIsActive ?
                        <span className="material-symbols material-symbols-rounded hvac-icon hvac-on">mode_fan</span>
                        :
                        <span className="material-symbols material-symbols-rounded hvac-icon hvac-off">mode_fan_off</span>
                    }
                    {tempData.ecoMode === EcoMode.on ?
                        <span className="material-symbols material-symbols-rounded mode-icon">nest_eco_leaf</span>
                        :
                        (tempData.tempMode === TempMode.off ?
                            <span className="material-symbols material-symbols-rounded mode-icon">mode_off_on</span>
                            : 
                            <div className="dial-buttons">
                                <button className="material-symbols material-symbols-rounded"
                                    onClick={() => bumpTemp(-decimalPrecision[tempData.tempUnits])}>
                                    remove
                                </button>
                                <button className="material-symbols material-symbols-rounded"
                                    onClick={() => bumpTemp(decimalPrecision[tempData.tempUnits])}>
                                    add
                                </button>
                            </div>
                        )
                    }
                </>
                :
                <>
                    <div className="dial-track"
                        style={{"--used-dial-ratio": usedDialRatio + "turn",
                        "--start-thumb": "0turn",
                        "--end-thumb": "0turn"} as React.CSSProperties}>
                    </div>
                    <div className="track-cover" aria-hidden="true"></div>
                    <div className="track-cap track-cap-outer" aria-hidden="true"
                        style={{"--cap-angle": -usedDialRatio/2 + "turn"} as React.CSSProperties}>
                    </div>
                    <div className="track-cap track-cap-outer" aria-hidden="true"
                        style={{"--cap-angle": usedDialRatio/2 + "turn"} as React.CSSProperties}>
                    </div>
                    <h2 id="offline-message">OFFLINE</h2>
                    <span className="material-symbols material-symbols-rounded mode-icon">sync_problem</span>
                </>
            }
        </section>
    );
}

export default Dial;