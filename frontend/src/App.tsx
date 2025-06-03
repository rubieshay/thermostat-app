import Dial from "./Dial";
import { TempDataProvider } from "./TempContext";

function App() {
    return (
        <TempDataProvider>
            <main>
                <Dial/>
            </main>
        </TempDataProvider>
    )
}

export default App;