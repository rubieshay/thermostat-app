import { TempDataProvider } from "./contexts/temp_data_context";
import { APIContextProvider } from "./contexts/api_context";
import InitialLoader from "./loading/initial_loader";
import { SettingsContextProvider } from "./contexts/settings_context";
import { WeatherContextProvider } from "./contexts/weather_context";
import { useBackButtonHandler } from "./utils/hooks";

function App() {
    useBackButtonHandler();

    return (
        <APIContextProvider>
            <SettingsContextProvider>
                <TempDataProvider>
                    <WeatherContextProvider>
                        <InitialLoader/>
                    </WeatherContextProvider>
                </TempDataProvider>
            </SettingsContextProvider>
        </APIContextProvider>
    );
}

export default App;