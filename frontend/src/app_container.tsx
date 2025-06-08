import { useContext } from "react";
import { TempDataContext } from "./temp_context";
import type { ChildrenProviderProps } from "./utils";
import AppLoading from "./app_loading";
import { usePageVisibilityRefresh } from "./utils";

export const AppContainer: React.FC<ChildrenProviderProps> = (props: ChildrenProviderProps) => {
    const {initialLoadComplete, stopRefreshTimer, startRefreshTimer, fetchTempData} = useContext(TempDataContext)
    const {} = usePageVisibilityRefresh({
        refreshData: fetchTempData,
        onStart: startRefreshTimer,
        onStop: stopRefreshTimer,
        refreshInterval: 5000 // 5 seconds
    });

    if (initialLoadComplete) {
        return (props.children)
    } else {
        return (
            <AppLoading></AppLoading>
        )
    }

}