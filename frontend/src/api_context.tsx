import { createContext, useState, useMemo, useCallback} from "react";
import { Preferences } from "@capacitor/preferences";
import { defaultAPIURL, type ChildrenProviderProps } from "./utils";

export interface APIContextType {
    apiURL: string | null,
    setAPIURL: (url: string) => void,
    validateURL: (url: string) => Promise<boolean>,
    retrieveAndValidateAPIURL: () => void,
    apiIsHealthy: boolean,
    initialAPICheckComplete: boolean
}

export const initAPIContext: APIContextType = {
    apiURL: null,
    setAPIURL: async () => {},
    validateURL: async () => {return false},
    retrieveAndValidateAPIURL: () => {},
    apiIsHealthy: false,
    initialAPICheckComplete: false
}

export const APIContext = createContext(initAPIContext);

export const APIContextProvider: React.FC<ChildrenProviderProps> = (props: ChildrenProviderProps) => {
    const [apiURL, setAPIURLState] = useState<string|null>(null);
    const [apiIsHealthy,setAPIIsHealthy] = useState(false);
    const [initialAPICheckComplete,setInitialAPICheckComplete] = useState(false);

    // try to retrieve and set API URL from preferences. If not there, default to environment
    // variable if it exists. If have a non-null URL, poll /healthz endpoint to see if up
    // if not up, or null, set validAPIURL to false;


    async function validateURL(url: string) : Promise<boolean> {
        // got a URL, see if it is healthy
        const healthURL = url + "/healthz";
        try {
            const response = await fetch(healthURL);
            if (response.ok) {return true;}
        } catch (error) {
            console.error("Tried to access API server " + healthURL + ". Error occurred: ", error);
            return false;
        }
        return false;
    }

    const retrieveAndValidateAPIURL = useCallback( async() => {
        console.log("retrieving and validating API URL");
        let tempURL : string|null = null;
        const { value } = await Preferences.get({ key: "apiURL"});
        if (value === null) {
            // get from default environment variable if exists
            console.log("not stored in preferences, getting from env var")
            tempURL = defaultAPIURL;
            console.log("From environment variable, test URL is now: "+tempURL);
        } else {
            // use what was in preferences API
            console.log("preferences had api stored:",value);
            tempURL = value;
        }
        if (tempURL === null) {
            console.log("no available URL, check complete");
            setAPIIsHealthy(false);
            setAPIURLState(null);
            setInitialAPICheckComplete(true);
            return;
        }
        // got a URL, see if it is healthy
        console.log("checking healthz URL on found endpoint: " + tempURL);
        const healthURL = tempURL;
        if (await validateURL(healthURL)) {
            console.log("URL validated, healthy");
            setAPIIsHealthy(true);
            setAPIURLState(tempURL);
        } else {
            console.log("URL not healthy");
            setAPIIsHealthy(false);
            setAPIURLState(tempURL)
        }
        setInitialAPICheckComplete(true);
    },[])

    async function setAPIURL(url: string) {
        setAPIURLState(url);
        await Preferences.set( {
            key: "apiURL",
            value: url
        })
    }

    const memoedValue = useMemo(() => ({
        apiURL, setAPIURL, validateURL, retrieveAndValidateAPIURL, apiIsHealthy, initialAPICheckComplete
    }),[apiURL, apiIsHealthy, retrieveAndValidateAPIURL,initialAPICheckComplete])

    return (
        <APIContext.Provider value={memoedValue}>{props.children}</APIContext.Provider>
    );

}