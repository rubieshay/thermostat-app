import { useContext } from "react";
import { themeOptions } from "../utils/constants";
import { SettingsContext } from "../contexts/settings_context";

function ThemeSetting() {
    const {themeSetting, setThemeSetting} = useContext(SettingsContext);
        const radioSelectedIndex = Math.max(0, themeOptions.findIndex((option) => themeSetting === option.themeSetting))

    return (
        <div className="input-group">
            <div className="label">Color Theme</div>
            <ul className="radio-buttons"
            style={{"--radio-options-count": themeOptions.length, "--radio-selected-index": radioSelectedIndex} as React.CSSProperties}>
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