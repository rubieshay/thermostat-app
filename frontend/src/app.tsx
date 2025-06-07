import Title from "./title";
import Dial from "./dial";
import Tiles from "./tiles";
import Error from "./error";
import { TempDataProvider } from "./temp_context";

function App() {
    return (
        <TempDataProvider>
            <main>
                <Title/>
                <Dial/>
                <Tiles/>
                <Error/>
            </main>
        </TempDataProvider>
    )
}

export default App;