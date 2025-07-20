import { createContext, useState, useMemo, useCallback, useEffect} from "react";
import { Preferences } from "@capacitor/preferences";
import { type ChildrenProviderProps } from "../utils/constants";
import { TempUnitsSetting, ThemeSetting } from "../types";
import { SafeArea } from '../plugins/safe-area';

export interface SettingsContextType {
    tempUnitsSetting: TempUnitsSetting,
    setTempUnitsSetting: (units: TempUnitsSetting) => Promise<void>,
    themeSetting: ThemeSetting,
    setThemeSetting: (mode: ThemeSetting) => Promise<void>,
    lastDeviceID: string | null,
    setLastDeviceID: (deviceID: string) => Promise<void>,
    changeInitialThemeComplete: boolean
}

export const initSettingsContext: SettingsContextType = {
    tempUnitsSetting: TempUnitsSetting.system,
    setTempUnitsSetting: async() => {},
    themeSetting: ThemeSetting.system,
    setThemeSetting: async() => {},
    lastDeviceID: null,
    setLastDeviceID: async() => {},
    changeInitialThemeComplete: false
}

export const SettingsContext = createContext(initSettingsContext);

export const SettingsContextProvider: React.FC<ChildrenProviderProps> = (props: ChildrenProviderProps) => {
    const [themeSetting, setThemeSettingState] = useState<ThemeSetting>(ThemeSetting.system);
    const [systemDark, setSystemDark] = useState<boolean>(true);    
    const [tempUnitsSetting, setTempUnitsSettingState] = useState<TempUnitsSetting>(TempUnitsSetting.system);
    const [initialSettingsLoadComplete, setInitialSettingsLoadComplete] = useState(false);
    const [changeInitialThemeComplete, setChangeInitialThemeComplete] = useState(false);
    const [lastDeviceID, setLastDeviceIDState] = useState<string|null>(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        // Create media query for dark mode
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        // Set initial state
        setSystemDark(mediaQuery.matches);

        // Handler for media query changes
        const handleChange = (e: MediaQueryListEvent) => {
            console.debug("media query change, setting systemDark to:", e.matches);
            setSystemDark(e.matches);
        };

        // Add event listener
        mediaQuery.addEventListener('change', handleChange);

        // Cleanup function
        return () => {
            mediaQuery.removeEventListener('change', handleChange);
        };
    }, []);

    const setThemeSetting = useCallback( async (mode: ThemeSetting) => {
        await Preferences.set({ key: "themeSetting", value: mode});
        setThemeSettingState(mode);
    },[]);

    const setTempUnitsSetting = useCallback( async (units: TempUnitsSetting) => {
        await Preferences.set({ key: "tempUnits", value: units});
        setTempUnitsSettingState(units);
    },[]);

    const setLastDeviceID = useCallback( async (lastDevID: string) => {
        await Preferences.set({key: "lastDeviceID", value: lastDevID});
        setLastDeviceIDState(lastDevID);
    },[])

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
        const {value: lastDevID} = await Preferences.get({ key: "lastDeviceID"});
        if (lastDevID === null) {
            setLastDeviceIDState(null);
        } else {
            setLastDeviceIDState(lastDevID);
        }
        setInitialSettingsLoadComplete(true);
    }, [setTempUnitsSetting,setThemeSetting]);

    const changeTheme = useCallback(async () => {
        if ((themeSetting === ThemeSetting.system && systemDark) || themeSetting === ThemeSetting.dark) {
            document.body.classList.remove("color-theme-light");
            await SafeArea.initialize();
            await SafeArea.changeSystemBarsIconsAppearance({isLight: false});

        } else {
            document.body.classList.add("color-theme-light");
            await SafeArea.initialize();
            await SafeArea.changeSystemBarsIconsAppearance({isLight: true});

        }
        setChangeInitialThemeComplete(true);
    }, [themeSetting,systemDark]);

    useEffect(() => {
        if (!initialSettingsLoadComplete) {
            loadSettings();
        };
    }, [initialSettingsLoadComplete, loadSettings, changeTheme ]);

    useEffect(() => {
        if (initialSettingsLoadComplete) {
            changeTheme();
        }
    }, [changeTheme, themeSetting, initialSettingsLoadComplete]);

    const memoedValue = useMemo(() => ({
        tempUnitsSetting, setTempUnitsSetting, themeSetting, setThemeSetting, changeInitialThemeComplete, lastDeviceID, setLastDeviceID
    }), [tempUnitsSetting, themeSetting, changeInitialThemeComplete, lastDeviceID,setThemeSetting,setTempUnitsSetting,setLastDeviceID])

    return (
        <SettingsContext.Provider value={memoedValue}>{props.children}</SettingsContext.Provider>
    );

}