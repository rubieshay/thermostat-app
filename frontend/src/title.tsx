import { useContext} from "react";
import { Connectivity } from "./types";
import { TempDataContext } from "./temp_data_context";

function Title() {
    const {selectedTempData: tempData} = useContext(TempDataContext);
    
    return (
        <h1>{tempData && tempData.connectivity === Connectivity.online ? tempData.deviceName : "Thermostat Not Found"}</h1>
    );
}

export default Title;