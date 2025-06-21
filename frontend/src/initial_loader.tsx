import { useEffect, useContext, useRef } from "react";
import { useNavigate } from 'react-router';
import { TempDataContext } from "./temp_data_context";
import { APIContext } from "./api_context";

function InitialLoader() {
    const navigate = useNavigate();
    const { loadInitialTempData } = useContext(TempDataContext);
    const { retrieveAndValidateAPIURL, apiIsHealthy, initialAPICheckComplete } = useContext(APIContext);
    const initialAPICheckAttempted = useRef(false);
    const initialLoadAttempted = useRef(false);


// when initially loaded, get URL from preferences/environment 
    useEffect( () => {
        const checkURL = async() => {
            if (initialAPICheckAttempted.current) {
                console.log("Already attempted initial API Check. staying on page");
                return;
            }
            initialAPICheckAttempted.current = true;
            retrieveAndValidateAPIURL();
        }
        checkURL();
    },[retrieveAndValidateAPIURL])

// if isAPIHealthy is still false and initialAPICheck is complete, navigate to url entry page
    useEffect( () => {
        if (initialAPICheckComplete && !apiIsHealthy) {
            navigate("/enterurl", {replace: true});
        }
    },[initialAPICheckComplete,apiIsHealthy,navigate])

// if API is healthy and good, then attempt to load initial data from backend API
    useEffect(() => {
        const loadAndNav = async() => {
            if (initialLoadAttempted.current) {
                console.log("Already attempted initial load... staying on page)");
                return;
            }
            initialLoadAttempted.current = true;
            console.log("loading initial temp data");
            await loadInitialTempData();
            console.log("data loaded, about to navigate to /app");
            navigate("/app", { replace: true });
        }
        if (apiIsHealthy && initialAPICheckComplete) {
            loadAndNav();
        }
    },[navigate, loadInitialTempData, apiIsHealthy,initialAPICheckComplete]);


    return (
        <></>
    )
}

export default InitialLoader;