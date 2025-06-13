import { useCallback, useContext, useRef, useState } from "react";
import { TempDataContext } from "./temp_context";
import AppLoading from "./app_loading";
import Title from "./title";
import Dial from "./dial";
import Tiles from "./tiles";
import Error from "./error";
import ModalDrawer from "./modal_drawer";
import { ModalDrawerType } from "./types";
import { dataRefreshTime, drawerTimeoutDuration, usePageVisibilityRefresh } from "./utils";
import { SplashScreen } from '@capacitor/splash-screen';;

export function AppContainer() {
    const { initialLoadComplete, okToStartRefreshTimer, stopRefreshTimer, startRefreshTimer, fetchTempData } = useContext(TempDataContext);
    const [modalDrawerType, setModalDrawerType] = useState<ModalDrawerType | null>(null);
    const fadeDrawerTimer = useRef<number | null>(null);

    const handleResetModal = useCallback((startTimer: boolean) => {
        if (fadeDrawerTimer.current) {
            clearTimeout(fadeDrawerTimer.current);
        }
        if (startTimer) {
            fadeDrawerTimer.current = window.setTimeout(() => {
                setModalDrawerType(null);
            }, drawerTimeoutDuration);
        }
    }, [setModalDrawerType]);

    usePageVisibilityRefresh({
        refreshData: fetchTempData,
        onStart: startRefreshTimer,
        onStop: stopRefreshTimer,
        refreshInterval: dataRefreshTime,
        okToStartRefresh: okToStartRefreshTimer
    });
    
    if (initialLoadComplete) {
        // Hide the splash screen after the initial load is complete
        SplashScreen.hide();
    }

    return (
        <>
            {initialLoadComplete ?
                <>
                    <main>
                        <Title/>
                        <Dial/>
                        <Tiles setModalDrawerType={setModalDrawerType}/>
                    </main>
                    <ModalDrawer modalDrawerType={modalDrawerType} handleResetModal={handleResetModal}/>
                    <Error/>
                </>
                :
                <AppLoading/>
            }
        </>
    );
}

export default AppContainer;