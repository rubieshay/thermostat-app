import { useContext, useState } from "react";
import { TempDataContext } from "./contexts/temp_data_context";

function ThermostatDropdown() {
    const {tempDataArray, changeDeviceID} = useContext(TempDataContext);
    const [dropdownIsOpen, setDropdownIsOpen] = useState<boolean>(false);

    function handleClickDropdown(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
        event.preventDefault();
        setDropdownIsOpen(!dropdownIsOpen);
    }

    function handleDropdownChange(event: React.MouseEvent<HTMLButtonElement, MouseEvent>, thisDeviceID: string | null) {
        event.preventDefault();
        if (thisDeviceID === null) {
            return;
        }
        changeDeviceID(thisDeviceID);
        setDropdownIsOpen(false);
    }

    if (tempDataArray.length <= 1) {
        return (
            <></>
        );
    } else {
        return (
            <div id="device-dropdown" className={"dropdown" + (dropdownIsOpen ? " active" : "")}
            aria-label="device select dropdown" style={{"--dropdown-size": tempDataArray.length} as React.CSSProperties}>
                <button onClick={(event) => handleClickDropdown(event)}>
                    <span className="material-symbols material-symbols-rounded">{"\ue5c5"}</span>
                </button>
                <ul className={dropdownIsOpen ? "" : "hidden"}>
                    {tempDataArray.map((tempData) =>
                        <li key={tempData.deviceID}>
                            <button onClick={(event) => handleDropdownChange(event, tempData.deviceID)}>
                                <span>{tempData.deviceName}</span>
                            </button>
                        </li>
                    )}
                </ul>
            </div>
        );
    }
}

export default ThermostatDropdown;