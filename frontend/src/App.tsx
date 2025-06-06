import Title from "./title";
import Dial from "./dial";
import Tiles from "./tiles";
import { TempDataProvider } from "./temp_context";

function App() {
    return (
        <TempDataProvider>
            <main>
                <Title/>
                <Dial/>
                <Tiles/>
            </main>
        </TempDataProvider>
    )
}

export default App;