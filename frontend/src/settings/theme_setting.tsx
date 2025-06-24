import { useContext } from "react";
import { themeOptions } from "../utils/constants";
import { SettingsContext } from "../contexts/settings_context";

function ThemeSetting() {
    const {themeSetting, setThemeSetting} = useContext(SettingsContext);

    return (
        <div className="input-group">
            <div className="label">Color Theme</div>
            <ul className="radio-buttons">
                {themeOptions.map((option) => (
                    <li key={option.themeSetting}
                    className={themeSetting === option.themeSetting ? "radio-selected" : ""}> 
                        <button onClick={() => {setThemeSetting(option.themeSetting)}}>{option.displayText}</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default ThemeSetting;