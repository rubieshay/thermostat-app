import { TempMode, EcoMode, TempUnitsSetting, ThemeSetting } from "../types";
import { stripSlashFromURLIfThere } from "./functions";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const demoMode = ((window as any)._env_.DEMO_MODE === "TRUE" ||
                         (window as any)._env_.DEMO_MODE === "1" ||
                         (window as any)._env_.DEMO_MODE === "YES") ? true : false;
export const defaultAPIURL = (window as any)._env_.DEFAULT_API_URL ? stripSlashFromURLIfThere((window as any)._env_.DEFAULT_API_URL) : null;
export const dataRefreshEnabled =((window as any)._env_.DATA_REFRESH_ENABLED === "TRUE" || 
                                  (window as any)._env_.DATA_REFRESH_ENABLED === "1" ||
                                  (window as any)._env_.DATA_REFRESH_ENABLED === "YES") ? true : false;
/* eslint-enable @typescript-eslint/no-explicit-any */                                  
export const appVersion = __APP_VERSION__;
console.debug("Environment driven settings:", {demoMode, defaultAPIURL, dataRefreshEnabled, appVersion});

export const debounceTime: number = 3000;
export const dataRefreshTime: number = 60000;
export const setPointFadeDuration: number = 3000;
export const drawerTimeoutDuration: number = 500;
export const fanTimerDisplayUpdateInterval: number = 15000;
 
export const minDialTemps: number[] = [9, 50];
export const maxDialTemps: number[] = [32, 90];
export const minRangeGap: number[] = [1.5, 3]
export const decimalPrecision: number[] = [0.5, 1.0];
export const usedDialRatio: number = 5/6;


// Material Symbols unicode values for reference

// \ue145 - add
// \ue15b - remove

// \uf168 - mode_fan
// \uec17 - mode_fan_off
// \uf537 - heat
// \uf557 - mode_dual
// \uf166 - mode_cool
// \uf16f - mode_off_on
// \uf8be - nest_eco_leaf

// \ue629 - sync_problem
// \ue575 - not_listed_location

// \ue88a - home

// \uf163 - humidity_high
// \uf164 - humidity_low
// \uf165 - humidity_mid

// \ue81a - sunny
// \uf172 - partly_cloudy_day
// \ue2bd - cloud
// \uf176 - rainy
// \ue2cd - weather_snowy
// \uf60b - weather_mix
// \uf67f - weather_hail
// \uebdb - thunderstorm
// \ue818 - foggy
// \ue188 - mist
// \ue199 - tornado
// \uebd5 - cyclone
// \uf070 - storm
// \uebd3 - severe_cold
// \uf4e5 - emergency_heat_2

// \uf34f - moon_stars
// \uf174 - partly_cloudy_night


export const tempModeOptions = [{tempMode: TempMode.heat, idText: "heat",
                                 displayText: "Heat", symbolText: "\uf537"},
                                {tempMode: TempMode.heatcool, idText: "heatcool",
                                 displayText: "Heat • Cool", symbolText: "\uf557"},
                                {tempMode: TempMode.cool, idText: "cool",
                                 displayText: "Cool", symbolText: "\uf166"},
                                {tempMode: TempMode.off, idText: "off",
                                 displayText: "Off", symbolText: "\uf16f"}]
export const ecoModeOptions = [{"ecoMode": EcoMode.on, idText: "on",
                                displayText: "On", symbolText: "\uf8be"},
                               {"ecoMode": EcoMode.off, idText: "off",
                                displayText: "Off", symbolText: "\uf16f"}]
export const fanTimerOptions = [{duration: 900, displayText: "15 min"},
                                {duration: 1800, displayText: "30 min"},
                                {duration: 2700, displayText: "45 min"},
                                {duration: 3600, displayText: "60 min"},
                                {duration: 7200, displayText: "2 hr"},
                                {duration: 14400, displayText: "4 hr"},
                                {duration: 28800, displayText: "8 hr"},
                                {duration: 43200, displayText: "12 hr"}]

export const tempUnitsOptions = [{displayText: "\u00B0C", tempUnitsSetting: TempUnitsSetting.celsius},
                                {displayText: "System", tempUnitsSetting: TempUnitsSetting.system},
                                {displayText: "\u00B0F", tempUnitsSetting: TempUnitsSetting.fahrenheit}]
export const themeOptions = [{displayText: "Light", themeSetting: ThemeSetting.light},
                                {displayText: "System", themeSetting: ThemeSetting.system},
                                {displayText: "Dark", themeSetting: ThemeSetting.dark}]

export const humidityRanges = [{rangeEnd: 0, symbolText: "\uf164"},
                                {rangeEnd: 40, symbolText: "\uf165"},
                                {rangeEnd: 60, symbolText: "\uf163"}]
export const weatherIcons = {
    day: {
        skc: {symbolText: "\ue81a", ariaText: "Sunny"},
        few: {symbolText: "\ue81a", ariaText: "Sunny"},
        sct: {symbolText: "\uf172", ariaText: "Partly Cloudy (Day)"},
        bkn: {symbolText: "\uf172", ariaText: "Partly Cloudy (Day)"},
        ovc: {symbolText: "\ue2bd", ariaText: "Cloudy"},
        wind_skc: {symbolText: "\ue81a", ariaText: "Sunny"},
        wind_few: {symbolText: "\ue81a", ariaText: "Sunny"},
        wind_sct: {symbolText: "\uf172", ariaText: "Partly Cloudy (Day)"},
        wind_bkn: {symbolText: "\uf172", ariaText: "Partly Cloudy (Day)"},
        wind_ovc: {symbolText: "\ue2bd", ariaText: "Cloudy"},
        snow: {symbolText: "\ue2cd", ariaText: "Snowy"},
        rain_snow: {symbolText: "\uf60b", ariaText: "Wintry Mix"},
        rain_sleet: {symbolText: "\uf60b", ariaText: "Wintry Mix"},
        snow_sleet: {symbolText: "\uf60b", ariaText: "Wintry Mix"},
        fzra: {symbolText: "\uf67f", ariaText: "Freezing Rain / Sleet / Hail"},
        rain_fzra: {symbolText: "\uf60b", ariaText: "Wintry Mix"},
        snow_fzra: {symbolText: "\uf60b", ariaText: "Wintry Mix"},
        sleet: {symbolText: "\uf67f", ariaText: "Freezing Rain / Sleet / Hail"},
        rain: {symbolText: "\uf176", ariaText: "Rainy"},
        rain_showers: {symbolText: "\uf176", ariaText: "Rainy"},
        rain_showers_hi: {symbolText: "\uf176", ariaText: "Rainy"},
        tsra: {symbolText: "\uebdb", ariaText: "Thunderstorms"},
        tsra_sct: {symbolText: "\uebdb", ariaText: "Thunderstorms"},
        tsra_hi: {symbolText: "\uebdb", ariaText: "Thunderstorms"},
        tornado: {symbolText: "\ue199", ariaText: "Tornado"},
        hurricane: {symbolText: "\uebd5", ariaText: "Hurricane"},
        tropical_storm: {symbolText: "\uf070", ariaText: "Tropical Storm"},
        dust: {symbolText: "\ue188", ariaText: "Dust / Smoke"},
        smoke: {symbolText: "\ue188", ariaText: "Dust / Smoke"},
        haze: {symbolText: "\ue818", ariaText: "Foggy / Haze"},
        hot: {symbolText: "\uf4e5", ariaText: "Extreme Heat"},
        cold: {symbolText: "\uebd3", ariaText: "Extreme Cold"},
        blizzard: {symbolText: "\ue2cd", ariaText: "Snowy"},
        fog: {symbolText: "\ue818", ariaText: "Foggy / Haze"}
    },
    night: {
        skc: {symbolText: "\uf34f", ariaText: "Clear Night"},
        few: {symbolText: "\uf34f", ariaText: "Clear Night"},
        sct: {symbolText: "\uf174", ariaText: "Partly Cloudy (Night)"},
        bkn: {symbolText: "\uf174", ariaText: "Partly Cloudy (Night)"},
        wind_skc: {symbolText: "\uf34f", ariaText: "Clear Night"},
        wind_few: {symbolText: "\uf34f", ariaText: "Clear Night"},
        wind_sct: {symbolText: "\uf174", ariaText: "Partly Cloudy (Night)"},
        wind_bkn: {symbolText: "\uf174", ariaText: "Partly Cloudy (Night)"},
    }
}

export type ChildrenProviderProps = {
    children: React.ReactNode;
}