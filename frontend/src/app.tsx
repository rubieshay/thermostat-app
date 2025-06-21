import { AppContainer } from "./app_container";
import { TempDataProvider } from "./temp_data_context";
import { APIContextProvider } from "./api_context";
import { Routes, Route } from "react-router";
import InitialLoader from "./initial_loader";
import EnterURL from "./enter_url"

function App() {
    return (
        <APIContextProvider>
            <TempDataProvider>
                <Routes>
                    <Route path="/" element={<InitialLoader />} />
                    <Route path="/enterurl" element={<EnterURL />} />
                    <Route path="/app" element={<AppContainer />} />
                </Routes>
            </TempDataProvider>
        </APIContextProvider>
    );
}

export default App;