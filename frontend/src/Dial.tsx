import { useContext, useEffect, useState, useRef } from "react";
import { TempUnits, TempMode, HvacStatus, Connectivity } from "./types";
import { roundedTemp, convertTemp, maxDialTemps, minDialTemps, usedDialRatio, decimalPrecision, debounceTime } from "./utils";
import { TempDataContext } from "./TempContext";

function Dial() {
    const {tempData, fetchTempData, setHeatCelsius, setCoolCelsius} = useContext(TempDataContext);
    const [dispCoolPoint, setDispCoolPoint] = useState<number | null>(null);
    const [dispHeatPoint, setDispHeatPoint] = useState<number | null>(null);
    const timeoutRef = useRef<number | null>(null);

    enum SetPointType {heat, cool};

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
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    function changeTemp(newTemp: number | null, setPointType: SetPointType) {
        // console.log("In ChangeTemp: " + newTemp + " type:" + setPointType);
        if (newTemp === null) {
            return;
        }
        let fixedTemp = Math.min(Math.max(minDialTemp, newTemp), maxDialTemp);
        if (setPointType === SetPointType.cool) {
            setDispCoolPoint(fixedTemp);
        } else {
            setDispHeatPoint(fixedTemp);
        }
        let celsiusFixedTemp: number | null = convertTemp(fixedTemp, tempData.tempUnits, TempUnits.celsius)

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            if (setPointType === SetPointType.cool) {
                setCoolCelsius(celsiusFixedTemp);
            } else {
                setHeatCelsius(celsiusFixedTemp);
            }
        }, debounceTime);
    }

    function bumpSetPoint(diff: number, setPointType: SetPointType) {
        let newTemp: number | null;
        if (setPointType === SetPointType.cool) {
            if (dispCoolPoint === null) {
                newTemp = null;
            } else {
                newTemp = dispCoolPoint + diff;
            }
        } else {
            if (dispHeatPoint === null) {
                newTemp = null;
            } else {
                newTemp = dispHeatPoint + diff;
            }
        }
        changeTemp(newTemp, setPointType);
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
        console.log("setpoints", dispCoolPoint, dispHeatPoint);
        console.log("angles", coolPointThumbAngle, heatPointThumbAngle);
        console.log("range", startRange, endRange);
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
                        <div className="dial-track"
                            style={{"--used-dial-ratio": usedDialRatio + "turn",
                                    "--start-thumb": activeTrackRange[0] + "turn",
                                    "--end-thumb": activeTrackRange[1] + "turn"} as React.CSSProperties}>
                        </div>
                        <div id="ambient-thumb-container"
                            className={"dial-thumb-container" + (dispAmbientTemp === null ? " dial-thumb-hidden" : "")}
                            style={{"--thumb-angle": ambientThumbAngle + "turn"} as React.CSSProperties}>
                            <div className="dial-thumb"></div>
                        </div>
                        <div id="heatpoint-thumb-container"
                            className={"dial-thumb-container" + (dispHeatPoint === null ? " dial-thumb-hidden" : "")}
                            style={{"--thumb-angle": heatPointThumbAngle + "turn"} as React.CSSProperties}>
                            <div className="dial-thumb"></div>
                        </div>
                        <div id="coolpoint-thumb-container"
                            className={"dial-thumb-container" + (dispCoolPoint === null ? " dial-thumb-hidden" : "")}
                            style={{"--thumb-angle": coolPointThumbAngle + "turn"} as React.CSSProperties}>
                            <div className="dial-thumb"></div>
                        </div>
                        <div id="main-numbers">
                            <div id="main-numbers-ambient" className="main-number-group">
                                <h2>Indoor</h2>
                                <h3>{(typeof dispAmbientTemp === "number") && !isNaN(dispAmbientTemp) ? dispAmbientTemp : ""}</h3>
                            </div>
                            {tempData.tempMode === TempMode.off ?
                                <></>
                                :
                                <div id="main-numbers-setpoints">
                                    {(tempData.tempMode === TempMode.heat || tempData.tempMode === TempMode.heatcool) ?
                                        <div id="main-numbers-heatpoint" className="main-number-group">
                                            <h2>Heat</h2>
                                            <h3>{(typeof dispHeatPoint === "number") && !isNaN(dispHeatPoint) ? dispHeatPoint : ""}</h3>
                                        </div>
                                        :
                                        <></>
                                    }
                                    {(tempData.tempMode === TempMode.cool || tempData.tempMode === TempMode.heatcool) ?
                                        <div id="main-numbers-coolpoint" className="main-number-group">
                                            <h2>Cool</h2>
                                            <h3>{(typeof dispCoolPoint === "number") && !isNaN(dispCoolPoint) ? dispCoolPoint : ""}</h3>
                                        </div>
                                        :
                                        <></>
                                    }
                                </div>
                            }
                        </div>
                        <div className="dial-buttons">
                            <button className="material-symbols-outlined" onClick={() => bumpSetPoint(-decimalPrecision[tempData.tempUnits], SetPointType.cool)}>
                                remove
                            </button>
                            <button className="material-symbols-outlined" onClick={() => bumpSetPoint(decimalPrecision[tempData.tempUnits], SetPointType.cool)}>
                                add
                            </button>
                        </div>
                        {/* <span className="material-symbols-outlined">mode_dual</span> */}
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
                    <div className="dial-track" style={{"--used-dial-ratio": usedDialRatio + "turn"} as React.CSSProperties}></div>
                    <h2 id="offline-message">OFFLINE</h2>
                </section>
            }
        </>
    )
}

export default Dial;