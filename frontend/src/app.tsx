import { Suspense } from "react";
import Title from "./title";
import Dial from "./dial";
import Tiles from "./tiles";
import Error from "./error";
import { AppContainer } from "./app_container";
import { TempDataProvider } from "./temp_context";

function App() {
    return (
        <TempDataProvider>
            <AppContainer>
                <main>
                    <Title/>
                    <Dial/>
                    <Tiles/>
                    <Error/>
                </main>
            </AppContainer>
        </TempDataProvider>
    )
}

export default App;