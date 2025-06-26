import { AppContainer } from "./app_container";
import { TempDataProvider } from "./contexts/temp_data_context";
import { APIContextProvider } from "./contexts/api_context";
import { Routes, Route } from "react-router";
import InitialLoader from "./loading/initial_loader";
import EnterURLPage from "./enter_url_page"
import { SettingsContextProvider } from "./contexts/settings_context";
import Settings from "./settings/settings";
import { useFontLoader } from "./loading/font_loader";
import { WeatherContextProvider } from "./contexts/weather_context";
import { useEffect } from "react";
import { useBackButtonHandler } from "./utils/hooks";

function App() {
    const [fontsLoaded] = useFontLoader();
    useBackButtonHandler();

    useEffect(() => {
        document.body.style.setProperty("--dial-transition-time", "400ms");
    }, []);

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
                            <Route path="/enterurl" element={<EnterURLPage />} />
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