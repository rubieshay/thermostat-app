import { createContext, useState, useMemo, useCallback, useEffect, useContext, useRef} from "react";
import { demoMode, type ChildrenProviderProps } from "../utils/constants";
import { demoWeatherData, initWeatherData, type WeatherData } from "../types";
import { APIContext } from "./api_context";

export interface WeatherContextType {
    weatherData: WeatherData,
    setWeatherData: (newWeatherData: WeatherData) => void,
    weatherDataLoaded: boolean
}

export const initWeatherContext: WeatherContextType = {
    weatherData: initWeatherData,
    setWeatherData: () => {},
    weatherDataLoaded: false
}

export const WeatherContext = createContext(initWeatherContext);

export const WeatherContextProvider: React.FC<ChildrenProviderProps> = (props: ChildrenProviderProps) => {
    const {apiIsHealthy, initialAPICheckComplete, apiURL} = useContext(APIContext);
    const [weatherData, setWeatherData] = useState<WeatherData>(initWeatherData);
    const [weatherDataLoaded, setWeatherDataLoaded] = useState<boolean>(false);

    const weatherDataLoading = useRef<boolean>(false)


    const getWeather = useCallback(async () => {
        console.log("Getting weather...");
        if (demoMode) {
            console.log("demo")
            setWeatherData(demoWeatherData);
            setWeatherDataLoaded(true);
            return;
        }
        if (!apiIsHealthy || !initialAPICheckComplete) {
            return;
        }
        if (weatherDataLoading.current) {
            return;
        }
        weatherDataLoading.current = true;
        const url = apiURL + "/weather";
        console.log("Weather URL:", url);
        try {
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            });
            if (!response.ok) {
                console.error("Failed to get weather : " + response.statusText);
                return;
            }
            console.log("fetched weather");
            const weatherData = await response.json();
            setWeatherData(weatherData);
            setWeatherDataLoaded(true);
        } catch (error) {
            console.error("Error with weather api:", error);
        }
    }, [apiURL, apiIsHealthy, initialAPICheckComplete]);

    useEffect(() => {
        getWeather()
    },[getWeather]);
    
    const memoedValue = useMemo(() => ({
        weatherData, setWeatherData, weatherDataLoaded
    }), [weatherData, weatherDataLoaded])

    return (
        <WeatherContext.Provider value={memoedValue}>{props.children}</WeatherContext.Provider>
    );

}