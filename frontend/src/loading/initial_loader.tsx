import { useEffect, useContext, useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import { Routes, Route } from "react-router";
import { TempDataContext } from "../contexts/temp_data_context";
import { APIContext } from "../contexts/api_context";
import { demoMode } from "../utils/constants";
import AppLoading from "./app_loading";
import { WeatherContext } from "../contexts/weather_context";
import { SettingsContext } from "../contexts/settings_context";
import { useFontLoader } from "./font_loader";
import Thermostat from "../thermostat";
import EnterURLPage from "../enter_url_page";
import Settings from "../settings/settings";

function InitialLoader() {
    const navigate = useNavigate();
    const location = useLocation();
    const {loadInitialTempData, tempDataLoaded} = useContext(TempDataContext);
    const {weatherDataLoaded} = useContext(WeatherContext);
    const {changeInitialThemeComplete} = useContext(SettingsContext);
    const {retrieveAndValidateAPIURL, apiIsHealthy, setAPIIsHealthy, initialAPICheckComplete, setInitialAPICheckComplete } = useContext(APIContext);
    const initialAPICheckAttempted = useRef(false);
    const initialLoadAttempted = useRef(false);
    const fontsLoaded = useFontLoader();
    const showLoadingIcon = useRef(false);

    const readyToNav = (tempDataLoaded && weatherDataLoaded && changeInitialThemeComplete && fontsLoaded);

    // when initially loaded, get URL from preferences/environment 
    useEffect(() => {
        const checkURL = async() => {
            if (initialAPICheckAttempted.current) {
                console.log("Already attempted initial API Check. staying on page");
                return;
            }
            initialAPICheckAttempted.current = true;
            retrieveAndValidateAPIURL();
        }
        if (!demoMode) {
            checkURL();
        } else {
            setInitialAPICheckComplete(true);
            setAPIIsHealthy(true);
        }
    }, [retrieveAndValidateAPIURL, setAPIIsHealthy, setInitialAPICheckComplete])

    // if isAPIHealthy is still false and initialAPICheck is complete, navigate to url entry page
    useEffect(() => {
        if (initialAPICheckComplete && !apiIsHealthy) {
            // setInitialAPICheckComplete(false);
            initialAPICheckAttempted.current = false;
            initialLoadAttempted.current = false;
            navigate("/enterurl", {replace: true});
        }
    }, [initialAPICheckComplete, setInitialAPICheckComplete, apiIsHealthy, navigate])

    // if API is healthy and good, then attempt to load initial data from backend API
    useEffect(() => {
        const loadAndNav = async() => {
            if (initialLoadAttempted.current) {
                return;
            }
            initialLoadAttempted.current = true;
            console.log("loading initial temp data");
            await loadInitialTempData();
        }
        if (apiIsHealthy && initialAPICheckComplete) {
            loadAndNav();
        }
    }, [navigate, location, loadInitialTempData, apiIsHealthy,initialAPICheckComplete]);

    useEffect(() => {
        if (readyToNav) {
            if (location.pathname === "/") {
                navigate("/app", {replace: true});
            } else {
                console.log("data loaded, not on root, stay on page");
            }
        }
    },[readyToNav, location.pathname, navigate]);

    useEffect(() => {
        const timer = setTimeout(() => {
            showLoadingIcon.current = false;
        },200);

        return ( () => {
            clearTimeout(timer);
        })
    },[])

    if (readyToNav || (!apiIsHealthy && initialAPICheckComplete && fontsLoaded)) {
        return(
            <Routes>
                <Route path="/" element={<></>} />
                <Route path="/app" element={<Thermostat/>}/>
                <Route path="/enterurl" element={<EnterURLPage/>}/>
                <Route path="/settings" element={<Settings/>}/>
            </Routes>
        );
    } else if (showLoadingIcon.current) {
        return (
            <AppLoading/>
        );
    } else {
        return (
        <></>
        );
    }
}

export default InitialLoader;