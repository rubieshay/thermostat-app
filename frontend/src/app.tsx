import { AppContainer } from "./app_container";
import { TempDataProvider } from "./temp_context";

function App() {
    return (
        <TempDataProvider>
            <AppContainer/>
        </TempDataProvider>
    );
}

export default App;