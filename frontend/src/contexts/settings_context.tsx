import { createContext, useState, useMemo, useCallback, useEffect, useRef} from "react";
import { Preferences } from "@capacitor/preferences";
import { dialTransitionDuration, type ChildrenProviderProps } from "../utils/constants";
import { TempUnitsSetting, ThemeSetting } from "../types";
import { SafeArea } from "@capacitor-community/safe-area";

export interface SettingsContextType {
    tempUnitsSetting: TempUnitsSetting,
    setTempUnitsSetting: (units: TempUnitsSetting) => void,
    themeSetting: ThemeSetting,
    setThemeSetting: (mode: ThemeSetting) => void,
    changeInitialThemeComplete: boolean
}

export const initSettingsContext: SettingsContextType = {
    tempUnitsSetting: TempUnitsSetting.system,
    setTempUnitsSetting: async() => {},
    themeSetting: ThemeSetting.system,
    setThemeSetting: async() => {},
    changeInitialThemeComplete: false
}

export const SettingsContext = createContext(initSettingsContext);

export const SettingsContextProvider: React.FC<ChildrenProviderProps> = (props: ChildrenProviderProps) => {
    const [themeSetting, setThemeSettingState] = useState<ThemeSetting>(ThemeSetting.system);
    const [usedTheme, setUsedTheme] = useState<ThemeSetting>(ThemeSetting.dark);
    const [tempUnitsSetting, setTempUnitsSettingState] = useState<TempUnitsSetting>(TempUnitsSetting.system);
    const [initialSettingsLoadComplete, setInitialSettingsLoadComplete] = useState(false);
    const [changeInitialThemeComplete, setChangeInitialThemeComplete] = useState(false);
    const changeThemeTimer = useRef<number | null>(null);

    const loadSettings = useCallback(async() => {
        const {value: themeValue} = await Preferences.get({ key: "themeSetting"});
        if (themeValue === null) {
            setThemeSetting(initSettingsContext.themeSetting);
        } else {
            setThemeSettingState(themeValue as ThemeSetting);
        }
        const {value: tempUnitsValue} = await Preferences.get({ key: "tempUnits"});
        if (tempUnitsValue === null) {
            setTempUnitsSetting(initSettingsContext.tempUnitsSetting);
        } else {
            setTempUnitsSettingState(tempUnitsValue as TempUnitsSetting);
        }
        setInitialSettingsLoadComplete(true);
    }, []);

    const changeTheme = useCallback(() => {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        if ((themeSetting === ThemeSetting.system && prefersDark) || themeSetting === ThemeSetting.dark) {
            setUsedTheme(ThemeSetting.dark);
            document.body.classList.remove("color-theme-light");
        } else {
            setUsedTheme(ThemeSetting.light);
            document.body.classList.add("color-theme-light");
        }
        if (changeThemeTimer.current) {
            clearTimeout(changeThemeTimer.current);
        }
        if (!changeInitialThemeComplete) {
            changeThemeTimer.current = window.setTimeout(() => {
                setChangeInitialThemeComplete(true);
            }, dialTransitionDuration);
        }
    }, [themeSetting, changeInitialThemeComplete]);

    const enableSafeArea = useCallback(() => {
        // both are transparent and created with css because the custom color bars doesn't appear to work
        if (usedTheme === ThemeSetting.dark) {
            SafeArea.enable({
                config: {
                    customColorsForSystemBars: true,
                    statusBarColor: "#00000000",
                    statusBarContent: "light",
                    navigationBarColor: "#00000000",
                    navigationBarContent: "light",
                },
            });
        } else {
            SafeArea.enable({
                config: {
                    customColorsForSystemBars: true,
                    statusBarColor: "#ffffff00",
                    statusBarContent: "dark",
                    navigationBarColor: "#ffffff00",
                    navigationBarContent: "dark",
                },
            });
        }
    }, [usedTheme]);

    useEffect(() => {
        if (!initialSettingsLoadComplete) {
            loadSettings();
        };
    }, [initialSettingsLoadComplete, loadSettings, changeTheme, enableSafeArea])

    useEffect(() => {
        changeTheme();
        console.log("changed theme");
    }, [changeTheme, themeSetting])

    useEffect(() => {
        enableSafeArea();
    }, [enableSafeArea, usedTheme])

    async function setThemeSetting(mode: ThemeSetting) {
        await Preferences.set({ key: "themeSetting", value: mode});
        setThemeSettingState(mode);
    }

    async function setTempUnitsSetting(units: TempUnitsSetting) {
        await Preferences.set({ key: "tempUnits", value: units});
        setTempUnitsSettingState(units);
    }

    const memoedValue = useMemo(() => ({
        tempUnitsSetting, setTempUnitsSetting, themeSetting, setThemeSetting, changeInitialThemeComplete
    }), [tempUnitsSetting, themeSetting, changeInitialThemeComplete])

    return (
        <SettingsContext.Provider value={memoedValue}>{props.children}</SettingsContext.Provider>
    );

}