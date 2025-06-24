import { useCallback, useContext, useRef, useState } from "react";
import { TempDataContext } from "./contexts/temp_data_context";
import AppLoading from "./loading/app_loading";
import HeaderBar from "./header_bar";
import Dial from "./dial";
import Tiles from "./tiles";
import Error from "./error";
import ModalDrawer from "./modal_drawer";
import { useSocketMessages } from "./utils/websocket_messages";
import { Connectivity, ModalDrawerType } from "./types";
import { dataRefreshTime, drawerTimeoutDuration, demoMode } from "./utils/constants";
import { usePageVisibilityRefresh } from "./utils/hooks";
import { WeatherContext } from "./contexts/weather_context";

export function AppContainer() {
    const { initialLoadComplete, okToStartRefreshTimer, stopRefreshTimer, startRefreshTimer, fetchTempData, selectedTempData: tempData } = useContext(TempDataContext);
    const { weatherDataLoaded } = useContext(WeatherContext);
    const [modalDrawerType, setModalDrawerType] = useState<ModalDrawerType | null>(null);
    const fadeDrawerTimer = useRef<number | null>(null);
    useSocketMessages(demoMode || !initialLoadComplete);

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

    return (
        <>
            {initialLoadComplete && weatherDataLoaded ?
                <>
                    <HeaderBar navLink="/settings" navSymbol={"\ue8b8"} pageTitle={(tempData && tempData.connectivity === Connectivity.online && tempData.deviceName !== null) ? tempData.deviceName : "Thermostat Not Found"}/>
                    <main>
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