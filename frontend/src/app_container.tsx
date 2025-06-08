import { useContext } from "react";
import { TempDataContext } from "./temp_context";
import type { ChildrenProviderProps } from "./utils";
import AppLoading from "./app_loading";
import { dataRefreshTime, usePageVisibilityRefresh } from "./utils";

export const AppContainer: React.FC<ChildrenProviderProps> = (props: ChildrenProviderProps) => {
    const {initialLoadComplete, okToStartRefreshTimer, stopRefreshTimer, startRefreshTimer, fetchTempData} = useContext(TempDataContext)
    usePageVisibilityRefresh({
        refreshData: fetchTempData,
        onStart: startRefreshTimer,
        onStop: stopRefreshTimer,
        refreshInterval: dataRefreshTime,
        okToStartRefresh: okToStartRefreshTimer
    });

    console.log("App Container rendering");

    if (initialLoadComplete) {
        return (props.children)
    } else {
        return (
            <AppLoading></AppLoading>
        )
    }

}