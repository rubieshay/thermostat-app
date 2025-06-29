import { TempDataProvider } from "./contexts/temp_data_context";
import { APIContextProvider } from "./contexts/api_context";
import InitialLoader from "./loading/initial_loader";
import { SettingsContextProvider } from "./contexts/settings_context";
import { WeatherContextProvider } from "./contexts/weather_context";
import { RouterProvider } from "react-router";
import EnterURLPage from "./enter_url_page";
import Settings from "./settings/settings";
import Thermostat from "./thermostat";
import { createBrowserRouter } from "react-router";

function App() {

    const router = createBrowserRouter([
        { path: "/", element: <InitialLoader/>, children: [
            { path: "/enterurl", element: <EnterURLPage/>},
            { path: "/app", element: <Thermostat />},
            { path: "/settings", element: <Settings />}
        ] },
    ]);

    return (
        <APIContextProvider>
            <SettingsContextProvider>
                <TempDataProvider>
                    <WeatherContextProvider>
                        <RouterProvider router={router}/>
                    </WeatherContextProvider>
                </TempDataProvider>
            </SettingsContextProvider>
        </APIContextProvider>
    );
}

export default App;