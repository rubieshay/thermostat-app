import { AppContainer } from "./app_container";
import { TempDataProvider } from "./contexts/temp_data_context";
import { APIContextProvider } from "./contexts/api_context";
import { Routes, Route } from "react-router";
import InitialLoader from "./loading/initial_loader";
import EnterURL from "./enter_url"
import { SettingsContextProvider } from "./contexts/settings_context";
import Settings from "./settings";
import { useFontLoader } from "./loading/font_loader";
import { WeatherContextProvider } from "./contexts/weather_context";

function App() {
    const [fontsLoaded] = useFontLoader();
    
    if (!fontsLoaded) {
        return <></>
    }
    return (
        <APIContextProvider>
            <SettingsContextProvider>
                <TempDataProvider>
                    <WeatherContextProvider>
                        <InitialLoader />
                        <Routes>
                            <Route path="/" element={<InitialLoader />} />
                            <Route path="/enterurl" element={<EnterURL />} />
                            <Route path="/app" element={<AppContainer />} />
                            <Route path="/settings" element={<Settings />} />
                        </Routes>
                    </WeatherContextProvider>
                </TempDataProvider>
            </SettingsContextProvider>
        </APIContextProvider>
    );
}

export default App;