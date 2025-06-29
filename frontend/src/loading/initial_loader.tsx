import AppLoading from "./app_loading";
import { useBackButtonHandler, useInitialLoader } from "../utils/hooks";
import { Outlet } from "react-router";

function InitialLoader() {
    const {showLoading} = useInitialLoader();
    useBackButtonHandler();
    if (showLoading) {
        return (
            <>
                <AppLoading/>
                <Outlet/>
            </>
        );
    } else {
        return (
            <Outlet/>
        );
    }
}

export default InitialLoader;