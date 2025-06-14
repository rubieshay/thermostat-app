import { useContext, useState, useEffect, type SetStateAction } from "react";
import { Connectivity, ModalDrawerType, TempUnits } from "./types";
import { TempDataContext } from "./temp_context";
import { getFanTimerString, isFanOn, tempModeOptions, ecoModeOptions, fanTimerDisplayUpdateInterval, getHumidityIcon, convertTemp } from "./utils";

interface TileProps {
    setModalDrawerType: React.Dispatch<SetStateAction<ModalDrawerType | null>>
}

const Tiles: React.FC<TileProps> = ({ setModalDrawerType }) => {
    const {selectedTempData: tempData} = useContext(TempDataContext);
    const [fanTimerString, setFanTimerString] = useState<string>("");
    const fanIsActive: boolean = isFanOn(tempData.fanTimer, tempData.hvacStatus);

    const ambientIndoorTempString = convertTemp(tempData.ambientTempCelsius, TempUnits.celsius, tempData.tempUnits) ? convertTemp(tempData.ambientTempCelsius, TempUnits.celsius, tempData.tempUnits)!.toString() + "\u00B0" : "not found";
    const ambientIndoorHumidityString = tempData.ambientHumidity ? Math.round(tempData.ambientHumidity).toString() + "%" : "not found";

    // this should maybe use the same data as the modal timer
    useEffect (() => {
        // Calculate immediately
        setFanTimerString(getFanTimerString(tempData.fanTimer, tempData.hvacStatus));

        // Update every 15 seconds
        const interval = setInterval(() => {
            setFanTimerString(getFanTimerString(tempData.fanTimer, tempData.hvacStatus));
        }, fanTimerDisplayUpdateInterval);

        return () => clearInterval(interval);

    }, [tempData.fanTimer, tempData.hvacStatus]);

    function handleSetModalDrawerType(drawerType: ModalDrawerType) {
        // handleResetModal(false);
        setModalDrawerType(drawerType);
    }

    return (
        <section id="tiles">
            <section id="control-tiles" className="tiles-group">
                {tempData.connectivity === Connectivity.online ?
                    <>
                        <button className="tile" onClick={() => handleSetModalDrawerType(ModalDrawerType.tempModeModal)}>
                            <h2>HVAC Mode</h2>
                            <div className="icon-text-group">
                                <span className="material-symbols material-symbols-rounded">
                                    {tempModeOptions.find((option) => option.tempMode === tempData.tempMode)?.symbolText}
                                </span>
                                <span>{tempModeOptions.find((option) => option.tempMode === tempData.tempMode)?.dispText}</span>
                            </div>
                        </button>
                        <button className="tile" onClick={() => handleSetModalDrawerType(ModalDrawerType.ecoModeModal)}>
                            <h2>Eco Mode</h2>
                            <div className="icon-text-group">
                                <span className="material-symbols material-symbols-rounded">
                                    {ecoModeOptions.find((option) => option.ecoMode === tempData.ecoMode)?.symbolText}
                                </span>
                                <span>{ecoModeOptions.find((option) => option.ecoMode === tempData.ecoMode)?.dispText}</span>
                            </div>
                        </button>
                        <button className="tile" onClick={() => handleSetModalDrawerType(ModalDrawerType.fanTimerModal)}>
                            <h2>Fan</h2>
                            <div className="icon-text-group">
                                {fanIsActive ?
                                    <span className="material-symbols material-symbols-rounded hvac-icon hvac-on">mode_fan</span>
                                    :
                                    <span className="material-symbols material-symbols-rounded hvac-icon hvac-off">mode_fan_off</span>
                                }
                                <span>{fanTimerString}</span>
                            </div>
                        </button>
                    </>
                    :
                    <></>
                }
            </section>
            <hr/>
            <section id="info-tiles" className="tiles-group">
                <div className="tile">
                    <h2>Indoor</h2>
                    <div className="icon-text-group">
                        <span className="material-symbols material-symbols-rounded">thermostat</span>
                        <span>{ambientIndoorTempString}</span>
                    </div>
                    <div className="icon-text-group">
                        <span className="material-symbols material-symbols-rounded">{getHumidityIcon(tempData.ambientHumidity)}</span>
                        <span>{ambientIndoorHumidityString}</span>
                    </div>
                </div>
                <div className="tile">
                    <h2>Outdoor</h2>
                    <div className="icon-text-group">
                        <span className="material-symbols material-symbols-rounded">thermostat</span>
                        <span>{ambientIndoorTempString}</span>
                    </div>
                    <div className="icon-text-group">
                        <span className="material-symbols material-symbols-rounded">{getHumidityIcon(tempData.ambientHumidity)}</span>
                        <span>{ambientIndoorHumidityString}</span>
                    </div>
                </div>
            </section>
        </section>
    )
}

export default Tiles;