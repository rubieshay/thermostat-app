import { useContext, useEffect, useState, useRef } from "react";
import { TempUnits, TempMode, EcoMode, HvacStatus, Connectivity } from "./types";
import { roundedTemp, convertTemp, maxDialTemps, minDialTemps, usedDialRatio, decimalPrecision, debounceTime } from "./utils";
import { TempDataContext } from "./TempContext";

function Dial() {
    enum SetPointType {heat, cool};

    const {tempData, fetchTempData, setHeatCelsius, setCoolCelsius} = useContext(TempDataContext);
    const [dispCoolPoint, setDispCoolPoint] = useState<number | null>(null);
    const [dispHeatPoint, setDispHeatPoint] = useState<number | null>(null);
    const [activeSetPoint, setActiveSetPoint] = useState<SetPointType | null>(null);
    const [lastSetPoint, setLastSetPoint] = useState<SetPointType | null>(null);
    // const setPointFadeDelay: useRef<number | null>(null);
    const sendDataTimeoutRef = useRef<number | null>(null);

    const dispAmbientTemp: number | null = roundedTemp(convertTemp(tempData.ambientTempCelsius, TempUnits.celsius, tempData.tempUnits), tempData.tempUnits);
    const maxDialTemp: number = maxDialTemps[tempData.tempUnits];
    const minDialTemp: number = minDialTemps[tempData.tempUnits];
    const midDialTemp: number = (maxDialTemp + minDialTemp) / 2;
    const dialRange: number = maxDialTemp - minDialTemp;

    let ambientThumbAngle: number | null = getThumbAngle(dispAmbientTemp);
    let coolPointThumbAngle: number | null = getThumbAngle(dispCoolPoint);
    let heatPointThumbAngle: number | null = getThumbAngle(dispHeatPoint);
    let activeTrackRange: number[] = getTrackRange();

    useEffect (() => {
        setActiveSetPoint(null);
        if (tempData.tempMode === TempMode.cool) {
            setLastSetPoint(SetPointType.cool);
        } else if (tempData.tempMode === TempMode.heat) {
            setLastSetPoint(SetPointType.heat);
        }
    }, [tempData.tempMode]);

    useEffect (() => {
        const unitTemp = convertTemp(tempData.coolCelsius, TempUnits.celsius, tempData.tempUnits);
        setDispCoolPoint(roundedTemp(unitTemp, tempData.tempUnits));
    }, [tempData.coolCelsius, tempData.tempUnits]);

    useEffect (() => {
        const unitTemp = convertTemp(tempData.heatCelsius, TempUnits.celsius, tempData.tempUnits);
        setDispHeatPoint(roundedTemp(unitTemp, tempData.tempUnits));
    }, [tempData.heatCelsius, tempData.tempUnits]);

    useEffect(() => {
        fetchTempData();
        return () => {
            if (sendDataTimeoutRef.current) {
                clearTimeout(sendDataTimeoutRef.current);
            }
        };
    }, []);

    function changeTemp(newTemp: number | null, setPointType: SetPointType | null) {
        if (newTemp === null || setPointType === null) {
            return;
        }
        let fixedTemp = Math.min(Math.max(minDialTemp, newTemp), maxDialTemp);
        if (setPointType === SetPointType.cool) {
            setDispCoolPoint(fixedTemp);
        } else {
            setDispHeatPoint(fixedTemp);
        }
        let celsiusFixedTemp: number | null = convertTemp(fixedTemp, tempData.tempUnits, TempUnits.celsius)

        if (sendDataTimeoutRef.current) {
            clearTimeout(sendDataTimeoutRef.current);
        }
        sendDataTimeoutRef.current = setTimeout(() => {
            if (setPointType === SetPointType.cool) {
                setCoolCelsius(celsiusFixedTemp);
                console.log("call set cool");
            } else {
                setHeatCelsius(celsiusFixedTemp);
                console.log("call set heat");
            }
        }, debounceTime);
    }

    function bumpSetPoint(diff: number) {
        // determine which setpoint to bump, and make active if needed
        let thisSetPoint = activeSetPoint;
        // if no last set point, choose based on the button pressed
        if (lastSetPoint === null) {
            if (diff > 0) {
                setLastSetPoint(SetPointType.heat);
                setActiveSetPoint(SetPointType.heat);
                thisSetPoint = SetPointType.heat;
            } else {
                setLastSetPoint(SetPointType.cool);
                setActiveSetPoint(SetPointType.cool);
                thisSetPoint = SetPointType.cool;
            }
        } else if (activeSetPoint === null) {
            setActiveSetPoint(lastSetPoint);
        }
        // change corresponding setpoint
        let newTemp: number | null = null;
        if (thisSetPoint === SetPointType.cool) {
            if (dispCoolPoint === null) {
                newTemp = null;
            } else {
                newTemp = dispCoolPoint + diff;
            }
        } else if (thisSetPoint === SetPointType.heat) {
            if (dispHeatPoint === null) {
                newTemp = null;
            } else {
                newTemp = dispHeatPoint + diff;
            }
        }
        changeTemp(newTemp, thisSetPoint);
    }

    function changeActiveSetpoint(setPointType: SetPointType | null): void {
        if (setPointType !== null) {
            setLastSetPoint(setPointType);
        }
        setActiveSetPoint(setPointType);
    }

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

    // function getThumbPos(thumbTemp: number) {
    //     // get radians relative to center
    //     let tempPercent: number = (thumbTemp - midDialTemp) / (dialRange / usedDialRatio) - 0.25;
    //     let tempRad: number = Math.PI * 2 * tempPercent;
    //     // cos (theta) * hyp = adj (x)
    //     // sin (theta) * hyp = opp (y)
    //     const centerX: number = Math.cos(tempRad);
    //     const centerY: number = Math.sin(tempRad);
    //     // adjust to css percentages from top left
    //     const edgeX: number = (centerX * 50) + 50;
    //     const edgeY: number = (centerY * 50) + 50;
    //     setDialThumbX(edgeX);
    //     setDialThumbY(edgeY);
    // }


    // on mouse click near thumb (give thumb padding and make button)
        // move dial according to angle from center
    // on mouse release anywhere
        // snap to nearest int
    

    // we need to change dispTemps to not be rounded, but only display numbers as rounded or create roundedDispTemps (also could split into decimal component for superscript-like decimals)

    return (
        <>
            <h1>{tempData.deviceName}</h1>
            {tempData.connectivity === Connectivity.online ?
                <>
                    <section id="dial"
                        className={tempData.hvacStatus === HvacStatus.cooling ? "hvac-status-cooling" :
                        (tempData.hvacStatus === HvacStatus.heating ? "hvac-status-heating" : "")}>
                        {/* DIAL TRACK */}
                        <div className="dial-track"
                            style={{"--used-dial-ratio": usedDialRatio + "turn",
                            "--start-thumb": activeTrackRange[0] + "turn",
                            "--end-thumb": activeTrackRange[1] + "turn"} as React.CSSProperties}>
                        </div>
                        <div className="track-cover" aria-hidden="true"></div>
                        <div className="track-cap" aria-hidden="true" style={{"--cap-angle": -usedDialRatio/2 + "turn", "--cap-bg": (tempData.tempMode === TempMode.cool ? "var(--cap-bg-in-range)" : "var(--cap-bg-out-range)")} as React.CSSProperties}></div>
                        <div className="track-cap" aria-hidden="true" style={{"--cap-angle": usedDialRatio/2 + "turn", "--cap-bg": (tempData.tempMode === TempMode.heat ? "var(--cap-bg-in-range)" : "var(--cap-bg-out-range)")} as React.CSSProperties}></div>
                        {/* DIAL THUMBS */}
                        <div id="ambient-thumb" className="dial-thumb"
                            style={{"--thumb-angle": ambientThumbAngle + "turn"} as React.CSSProperties}>
                        </div>
                        {tempData.tempMode === TempMode.heat || tempData.tempMode === TempMode.heatcool ?
                            <div id="heatpoint-thumb" className={"dial-thumb dial-thumb-clickable" +
                                (activeSetPoint === SetPointType.heat ? " dial-thumb-active": "")}
                                style={{"--thumb-angle": heatPointThumbAngle + "turn"} as React.CSSProperties}>
                            </div>
                            :
                            <></>
                        }
                        {tempData.tempMode === TempMode.cool || tempData.tempMode === TempMode.heatcool ?
                            <div id="coolpoint-thumb" className={"dial-thumb dial-thumb-clickable" +
                                (activeSetPoint === SetPointType.cool ? " dial-thumb-active": "")}
                                style={{"--thumb-angle": coolPointThumbAngle + "turn"} as React.CSSProperties}>
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
                                        <button id="main-numbers-heatpoint" className={"main-number-group" + (activeSetPoint === SetPointType.heat ? " setpoint-active" : "")} onClick={() => changeActiveSetpoint(SetPointType.heat)}>
                                            <h2>Heat</h2>
                                            <h3>{(typeof dispHeatPoint === "number") && !isNaN(dispHeatPoint) ? dispHeatPoint : ""}</h3>
                                        </button>
                                        :
                                        <></>
                                    }
                                    {tempData.tempMode === TempMode.cool || tempData.tempMode === TempMode.heatcool ?
                                        <button id="main-numbers-coolpoint" className={"main-number-group" + (activeSetPoint === SetPointType.cool ? " setpoint-active" : "")} onClick={() => changeActiveSetpoint(SetPointType.cool)}>
                                            <h2>Cool</h2>
                                            <h3>{(typeof dispCoolPoint === "number") && !isNaN(dispCoolPoint) ? dispCoolPoint : ""}</h3>
                                        </button>
                                        :
                                        <></>
                                    }
                                </div>
                            }
                        </div>
                        {/* PLUS/MINUS BUTTONS */}
                        {tempData.ecoMode === EcoMode.on ?
                            <div className="material-symbols-outlined bottom-icon">nest_eco_leaf</div>
                            :
                            <div className="dial-buttons">
                                <button className="material-symbols-outlined"
                                    onClick={() => bumpSetPoint(-decimalPrecision[tempData.tempUnits])}>
                                    remove
                                </button>
                                <button className="material-symbols-outlined"
                                    onClick={() => bumpSetPoint(decimalPrecision[tempData.tempUnits])}>
                                    add
                                </button>
                            </div>
                        }
                    </section>
                    <section id="info">
                        <div>HVAC Status: {tempData.hvacStatus}</div>
                        <div>Temp Mode: {tempData.tempMode}</div>
                        <div>Connectivity: {tempData.connectivity}</div>
                        <div>Fan Timer: {String(tempData.fanTimer)}</div>
                    </section>
                </>
                :
                <section id="dial">
                    <div className="dial-track"
                        style={{"--used-dial-ratio": usedDialRatio + "turn",
                        "--start-thumb": activeTrackRange[0] + "turn",
                        "--end-thumb": activeTrackRange[1] + "turn"} as React.CSSProperties}>
                        <div className="track-cover" aria-hidden="true"></div>
                    </div>
                    <h2 id="offline-message">OFFLINE</h2>
                </section>
            }
        </>
    )
}

export default Dial;