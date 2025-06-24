import EnterURLComponent from "../enter_url_component";
import HeaderBar from "../header_bar";
import TempUnitsSetting from "./temp_units_setting";
import ThemeSetting from "./theme_setting";

function Settings() {

    return (
        <>
            <HeaderBar navLink={"/app"} navSymbol={"\ue88a"} pageTitle={"Settings"}/>
            <main id="settings-page">
                <EnterURLComponent navLink={null} label="Change API URL"></EnterURLComponent>
                <hr/>
                <TempUnitsSetting/>
                <hr/>
                <ThemeSetting/>
            </main>
        </>
    );
}

export default Settings;