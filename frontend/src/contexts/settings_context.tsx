import { createContext, useState, useMemo, useCallback, useEffect} from "react";
import { Preferences } from "@capacitor/preferences";
import { type ChildrenProviderProps } from "../utils/constants";
import { TempUnitsSetting, ThemeSetting } from "../types";
import { SafeArea } from "@capacitor-community/safe-area";

export interface SettingsContextType {
    tempUnitsSetting: TempUnitsSetting,
    setTempUnits: (units: TempUnitsSetting) => void,
    themeSetting: ThemeSetting,
    setThemeSetting: (mode: ThemeSetting) => void
}

export const initSettingsContext: SettingsContextType = {
    tempUnitsSetting: TempUnitsSetting.system,
    setTempUnits: async() => {},
    themeSetting: ThemeSetting.system,
    setThemeSetting: async() => {}
}

export const SettingsContext = createContext(initSettingsContext);

export const SettingsContextProvider: React.FC<ChildrenProviderProps> = (props: ChildrenProviderProps) => {
    const [themeSetting, setThemeSettingState] = useState<ThemeSetting>(ThemeSetting.system);
    const [usedTheme, setUsedTheme] = useState<ThemeSetting>(ThemeSetting.dark);
    const [tempUnitsSetting, setTempUnitsSettingState] = useState<TempUnitsSetting>(TempUnitsSetting.system);
    const [initialSettingsLoadComplete, setInitialSettingsLoadComplete] = useState(false);

    const loadSettings = useCallback( async() => {
        const {value: themeValue} = await Preferences.get({ key: "themeSetting"});
        if (themeValue === null) {
            setThemeSetting(initSettingsContext.themeSetting);
        } else {
            setThemeSettingState(themeValue as ThemeSetting);
        }
        const {value: tempValue} = await Preferences.get({ key: "tempUnits"});
        if (tempValue === null) {
            setTempUnits(initSettingsContext.tempUnitsSetting);
        } else {
            setTempUnitsSettingState(tempValue as TempUnitsSetting);
        }
        setInitialSettingsLoadComplete(true);
    },[]);

    const changeTheme = useCallback(() => {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
        if ((themeSetting === ThemeSetting.system && prefersDark) || themeSetting === ThemeSetting.dark) {
            setUsedTheme(ThemeSetting.dark);
            document.body.classList.remove("color-scheme-light");
        } else {
            setUsedTheme(ThemeSetting.light);
            document.body.classList.add("color-scheme-light");
        }
    }, [themeSetting]);

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
    }, [changeTheme, themeSetting])

    useEffect(() => {
        enableSafeArea();
    }, [enableSafeArea, usedTheme])

    async function setThemeSetting(mode: ThemeSetting) {
        await Preferences.set({ key: "themeSetting", value: mode});
        setThemeSettingState(mode);
    }

    async function setTempUnits(units: TempUnitsSetting) {
        await Preferences.set({ key: "tempUnits", value: units});
        setTempUnitsSettingState(units);
    }

    const memoedValue = useMemo(() => ({
        tempUnitsSetting, setTempUnits, themeSetting, setThemeSetting
    }), [tempUnitsSetting, themeSetting])

    return (
        <SettingsContext.Provider value={memoedValue}>{props.children}</SettingsContext.Provider>
    );

}