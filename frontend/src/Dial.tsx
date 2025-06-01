import { useContext, useEffect, useState, useRef } from "react";
import * as utils from "./utils";
import { TempDataContext } from "./TempContext";

function Dial() {
    const {tempData, setHeatCelsius, setCoolCelsius} = useContext(TempDataContext);
    const [dispCoolPoint, setDispCoolPoint] = useState<number | null>(null);
    const [dispHeatPoint, setDispHeatPoint] = useState<number | null>(null);
    const timeoutRef = useRef<number | null>(null);
    enum SetPointType {heat, cool};

    const dispAmbientTemp: number | null = utils.convertTemp(tempData.ambientTempCelsius, utils.TempUnits.celsius, tempData.tempUnits);
    const maxDialTemp: number = utils.maxDialTemps[tempData.tempUnits];
    const minDialTemp: number = utils.minDialTemps[tempData.tempUnits];
    const midDialTemp: number = (maxDialTemp + minDialTemp) / 2;
    const dialRange: number = maxDialTemp - minDialTemp;

    let coolPointThumbAngle: number | null = getThumbAngle(dispCoolPoint);
    let heatPointThumbAngle: number | null = getThumbAngle(dispHeatPoint);

    useEffect (() => {
        const unitTemp = utils.convertTemp(tempData.coolCelsius, utils.TempUnits.celsius, tempData.tempUnits);
        setDispCoolPoint(utils.roundedTemp(unitTemp, tempData.tempUnits));
    }, [tempData.coolCelsius, tempData.tempUnits]);

    useEffect (() => {
        const unitTemp = utils.convertTemp(tempData.heatCelsius, utils.TempUnits.celsius, tempData.tempUnits);
        setDispHeatPoint(utils.roundedTemp(unitTemp, tempData.tempUnits));
    }, [tempData.heatCelsius, tempData.tempUnits]);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    function changeTemp(newTemp: number | null, setPointType: SetPointType) {
        console.log("In ChangeTemp: " + newTemp + " type:" + setPointType);
        if (newTemp === null) {
            return;
        }
        let fixedTemp = Math.min(Math.max(minDialTemp, newTemp), maxDialTemp);
        if (setPointType === SetPointType.cool) {
            setDispCoolPoint(fixedTemp);
        } else {
            setDispHeatPoint(fixedTemp);
        }
        let celsiusFixedTemp: number | null = utils.convertTemp(fixedTemp, tempData.tempUnits, utils.TempUnits.celsius)

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            if (setPointType === SetPointType.cool) {
                setCoolCelsius(celsiusFixedTemp);
            } else {
                setHeatCelsius(celsiusFixedTemp);
            }
        }, utils.debounceTime);
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
        return (thumbTemp - midDialTemp) / (dialRange / utils.usedDialRatio);
    }

    // function getThumbPos(thumbTemp: number) {
    //     // get radians relative to center
    //     let tempPercent: number = (thumbTemp - midDialTemp) / (dialRange / utils.usedDialRatio) - 0.25;
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

    // on mouse click in circle
        // move dial according to angle from center
    // on mouse release anywhere
        // set temp and snap to nearest int

    return (
        <section id="dial">
            <div className="dial-track" style={{"--used-dial-ratio": utils.usedDialRatio + "turn"} as React.CSSProperties}></div>
            <div id="heatpoint-thumb-container" className="dial-thumb-container" style={{"--turn-angle": heatPointThumbAngle + "turn"} as React.CSSProperties}>
                {/* <div className="dial-thumb" style={{"--x-percent": dialThumbX + "%", "--y-percent": dialThumbY + "%"} as React.CSSProperties}></div> */}
                <div className="dial-thumb"></div>
            </div>
            <div id="coolpoint-thumb-container" className="dial-thumb-container" style={{"--turn-angle": coolPointThumbAngle + "turn"} as React.CSSProperties}>
                {/* <div className="dial-thumb" style={{"--x-percent": dialThumbX + "%", "--y-percent": dialThumbY + "%"} as React.CSSProperties}></div> */}
                <div className="dial-thumb"></div>
            </div>
            <h2 id="ambient-temp">
                <span>{dispHeatPoint}</span>
                <span>{dispAmbientTemp}</span>
                <span>{dispCoolPoint}</span>
            </h2>
            <div className="dial-buttons">
                <button onClick={() => bumpSetPoint(-utils.decimalPrecision[tempData.tempUnits], SetPointType.cool)}>
                    <span className="material-symbols-outlined">remove</span>
                </button>
                <button onClick={() => bumpSetPoint(utils.decimalPrecision[tempData.tempUnits], SetPointType.cool)}>
                    <span className="material-symbols-outlined">add</span>
                </button>
            </div>
            {/* <span className="material-symbols-outlined">mode_dual</span> */}
        </section>
    )
}

export default Dial;