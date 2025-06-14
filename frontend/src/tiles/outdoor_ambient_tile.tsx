import { useEffect } from "react";
import { getHumidityIcon } from "../utils";

function OutdoorAmbientTile() {
    useEffect(() => {
        
    }, []);

    return (
        <div className="tile">
            <h2>Outdoor</h2>
            <div className="icon-text-group">
                <span className="material-symbols material-symbols-rounded">partly_cloudy_day</span>
                <span>{"65\u00B0"}</span>
            </div>
            <div className="icon-text-group">
                <span className="material-symbols material-symbols-rounded">{getHumidityIcon(79)}</span>
                <span>79%</span>
            </div>
        </div>
    );
}

export default OutdoorAmbientTile;