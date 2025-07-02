import { NavLink } from "react-router";
import ThermostatDropdown from "./thermostat_dropdown";

function HeaderBar({ navLink, navSymbol, pageTitle, hasThermostatDropdown }: {navLink: string, navSymbol: string, pageTitle: string, hasThermostatDropdown: boolean}) {
    
    return (
        <header>
            <NavLink to={navLink} className="icon-button material-symbols material-symbols-rounded" viewTransition>{navSymbol}</NavLink>
            <h1>{pageTitle}</h1>
            {hasThermostatDropdown ?
                <ThermostatDropdown/>
                :
                <></>
            }
        </header>
    );
}

export default HeaderBar;