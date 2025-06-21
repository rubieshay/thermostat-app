import { AppContainer } from "./app_container";
import { TempDataProvider } from "./temp_data_context";
import { APIContextProvider } from "./api_context";
import { Routes, Route } from "react-router";
import InitialLoader from "./initial_loader";
import EnterURL from "./enter_url"
import { SettingsContextProvider } from "./settings_context";
import Settings from "./settings";
import { useFontLoader } from "./font_loader";

function App() {
    const [fontsLoaded] = useFontLoader();
    
    if (!fontsLoaded) {
        return <></>
    }
    return (
        <APIContextProvider>
            <SettingsContextProvider>
                <TempDataProvider>
                    <Routes>
                        <Route path="/" element={<InitialLoader />} />
                        <Route path="/enterurl" element={<EnterURL />} />
                        <Route path="/app" element={<AppContainer />} />
                        <Route path="/settings" element={<Settings />} />
                    </Routes>
                </TempDataProvider>
            </SettingsContextProvider>
        </APIContextProvider>
    );
}

export default App;