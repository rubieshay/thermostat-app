import { useContext, type SetStateAction } from "react";
import { Connectivity, ModalDrawerType } from "./types";
import { TempDataContext } from "./contexts/temp_data_context";
import IndoorAmbientTile from "./tiles/indoor_ambient_tile";
import OutdoorAmbientTile from "./tiles/outdoor_ambient_tile";
import TempModeTile from "./tiles/temp_mode_tile";
import EcoModeTile from "./tiles/eco_mode_tile";
import FanTimerTile from "./tiles/fan_timer_tile";

interface TileProps {
    setModalDrawerType: React.Dispatch<SetStateAction<ModalDrawerType | null>>
}

const Tiles: React.FC<TileProps> = ({ setModalDrawerType }) => {
    const {selectedTempData: tempData} = useContext(TempDataContext);

    return (
        <>
            {tempData.connectivity === Connectivity.online ?
                <>
                    <section id="tiles">
                        <section id="control-tiles" className="tiles-group">
                            <TempModeTile setModalDrawerType={setModalDrawerType}/>
                            <EcoModeTile setModalDrawerType={setModalDrawerType}/>
                            <FanTimerTile setModalDrawerType={setModalDrawerType}/>
                        </section>
                        <hr/>
                        <section id="info-tiles" className="tiles-group">
                            <IndoorAmbientTile/>
                            <OutdoorAmbientTile/>
                        </section>
                    </section>
                </>
                :
                <></>
            }
        </>
    );
}

export default Tiles;