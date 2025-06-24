import { useEffect, useContext, useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import { TempDataContext } from "../contexts/temp_data_context";
import { APIContext } from "../contexts/api_context";
import { demoMode } from "../utils/constants";

function InitialLoader() {
    const navigate = useNavigate();
    const location = useLocation();
    const { loadInitialTempData } = useContext(TempDataContext);
    const { retrieveAndValidateAPIURL, apiIsHealthy, setAPIIsHealthy, initialAPICheckComplete, setInitialAPICheckComplete } = useContext(APIContext);
    const initialAPICheckAttempted = useRef(false);
    const initialLoadAttempted = useRef(false);

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
            setInitialAPICheckComplete(false);
            initialAPICheckAttempted.current = false;
            initialLoadAttempted.current = false;
            navigate("/enterurl", {replace: true});
        }
    }, [initialAPICheckComplete, setInitialAPICheckComplete, apiIsHealthy, navigate])

    // if API is healthy and good, then attempt to load initial data from backend API
    useEffect(() => {
        const loadAndNav = async() => {
            if (initialLoadAttempted.current) {
                console.log("Already attempted initial load... staying on page");
                return;
            }
            initialLoadAttempted.current = true;
            console.log("loading initial temp data");
            await loadInitialTempData();
            if (location.pathname === "/") {
                console.log("data loaded, on /, about to navigate to /app");
                navigate("/app", { replace: true});
            } else {
                console.log("data is loaded, but not on root, stay where you are.");
            }
        }
        if (apiIsHealthy && initialAPICheckComplete) {
            loadAndNav();
        }
    }, [navigate, location, loadInitialTempData, apiIsHealthy,initialAPICheckComplete]);


    return (
        <></>
    );
}

export default InitialLoader;