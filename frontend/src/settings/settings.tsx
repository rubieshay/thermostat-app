import EnterURLComponent from "../enter_url_component";
import HeaderBar from "../header_bar";
import { appVersion, demoMode } from "../utils/constants";
import TempUnitsSetting from "./temp_units_setting";
import ThemeSetting from "./theme_setting";

function Settings() {

    return (
        <>
            <HeaderBar navLink={"/app"} navSymbol={"\ue88a"} pageTitle={"Settings"} hasThermostatDropdown={false}/>
            <main id="settings-page">
                <h2>
                    <span>App Version: </span>
                    <span>{appVersion}</span>
                </h2>
                <hr/>
                {demoMode ?
                    <></>
                    :
                    <>
                        <EnterURLComponent navLink={null} label="Change API URL"></EnterURLComponent>
                        <hr/>
                    </>
                }
                <TempUnitsSetting/>
                <hr/>
                <ThemeSetting/>
            </main>
        </>
    );
}

export default Settings;