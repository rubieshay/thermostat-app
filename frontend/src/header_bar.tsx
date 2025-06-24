import { NavLink } from "react-router";

function HeaderBar({ navLink, navSymbol, pageTitle }: {navLink: string, navSymbol: string, pageTitle: string}) {
    
    return (
        <header>
            <NavLink to={navLink} className="icon-button material-symbols material-symbols-rounded">{navSymbol}</NavLink>
            <h1>{pageTitle}</h1>
        </header>
    );
}

export default HeaderBar;