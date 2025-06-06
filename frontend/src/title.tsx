import { useContext, useEffect } from "react";
import { Connectivity } from "./types";
import { TempDataContext } from "./temp_context";

function Title() {
    const {getSelectedTempData, fetchTempData} = useContext(TempDataContext);

    useEffect(() => {
        fetchTempData();
    }, []);

    const tempData = getSelectedTempData();
    
    return (
        <h1>{tempData && tempData.connectivity === Connectivity.online ? tempData.deviceName : "Thermostat Not Found"}</h1>
    );
}

export default Title;