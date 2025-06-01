import Dial from "./Dial";
import { TempDataProvider } from "./TempContext";

function App() {
    return (
        <TempDataProvider>
            <main>
                <h1>My Thermostat</h1>
                <Dial/>
            </main>
        </TempDataProvider>
    )
}

export default App;
