import { createContext, useState, useMemo, useCallback, useEffect} from "react";
import { Preferences } from "@capacitor/preferences";
import { type ChildrenProviderProps } from "./utils";
import { TempUnitsName, ThemeMode } from "./types";
import { SafeArea } from '@capacitor-community/safe-area';

export interface SettingsContextType {
    themeMode: ThemeMode,
    tempUnits: TempUnitsName,
    setThemeMode: (mode: ThemeMode) => void,
    setTempUnits: (units: TempUnitsName) => void
}

export const initSettingsContext: SettingsContextType = {
    themeMode: ThemeMode.DarkMode,
    tempUnits: TempUnitsName.fahrenheit,
    setThemeMode: async() => {},
    setTempUnits: async() => {}
}

export const SettingsContext = createContext(initSettingsContext);

export const SettingsContextProvider: React.FC<ChildrenProviderProps> = (props: ChildrenProviderProps) => {
    const [themeMode, setThemeModeState] = useState<ThemeMode>(ThemeMode.DarkMode);
    const [tempUnits, setTempUnitsState] = useState<TempUnitsName>(TempUnitsName.fahrenheit);
    const [initialSettingsLoadComplete, setInitialSettingsLoadComplete] = useState(false);


    const loadSettings = useCallback( async() => {
        const {value: themeValue} = await Preferences.get({ key: "themeMode"});
        if (themeValue === null) {
            setThemeMode(initSettingsContext.themeMode);
        } else {
            setThemeModeState(themeValue as ThemeMode)
        }
        const {value: tempValue} = await Preferences.get({ key: "tempUnits"});
        if (tempValue === null) {
            setTempUnits(initSettingsContext.tempUnits);
        } else {
            setTempUnitsState(tempValue as TempUnitsName);
        }
        setInitialSettingsLoadComplete(true);
    },[]);

    const enableSafeArea = useCallback( () => {
        if (themeMode === ThemeMode.DarkMode) {
            SafeArea.enable({
                config: {
                    customColorsForSystemBars: true,
                    statusBarColor: '#00000000', // transparent
                    statusBarContent: 'light',
                    navigationBarColor: '#00000000', // transparent
                    navigationBarContent: 'light',
                },
            });
        } else {
            SafeArea.enable({
                config: {
                    customColorsForSystemBars: true,
                    statusBarColor: '#ffffffff', // transparent
                    statusBarContent: 'dark',
                    navigationBarColor: '#ffffffff', // transparent
                    navigationBarContent: 'dark',
                },
            });
        }
    },[themeMode])

    useEffect( () => {
        if (!initialSettingsLoadComplete) {
            loadSettings();
            enableSafeArea();
        };
    },[initialSettingsLoadComplete,loadSettings,enableSafeArea])

    useEffect( () => {
        enableSafeArea();
    },[enableSafeArea])

    async function setThemeMode(mode: ThemeMode) {
        await Preferences.set({ key: "themeMode", value: mode});
        setThemeModeState(mode);
    }

    async function setTempUnits(units: TempUnitsName) {
        await Preferences.set({ key: "tempUnits", value: units});
        setTempUnitsState(units);
    }

    const memoedValue = useMemo(() => ({
        themeMode,tempUnits,setThemeMode,setTempUnits
    }), [tempUnits, themeMode])

    return (
        <SettingsContext.Provider value={memoedValue}>{props.children}</SettingsContext.Provider>
    );

}