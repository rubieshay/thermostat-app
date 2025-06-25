import { useContext, useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { APIContext } from "./contexts/api_context";
import { useNavigate } from "react-router";

function EnterURLComponent({ navLink, label } : {navLink: string | null, label: string}) {
    const {apiURL, setAPIURL, validateURL, setAPIValidated} = useContext(APIContext);
    const [inputURL, setInputURL] = useState<string>("");
    const [apiResponse, setAPIResponse] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (apiURL !== null) {
            setInputURL(apiURL);
        }
    }, [apiURL]);

    function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
        setInputURL(event.target.value);
        setAPIResponse(null);
    }

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        const fetchReturn = await validateURL(inputURL);
        if (fetchReturn.success) {
            setInputURL("");
            setAPIResponse("API Validated Successfully");
            await setAPIURL(inputURL);
            setAPIValidated();
            if (navLink !== null) {
                navigate(navLink, {replace: true});
            }
        } else {
            if (fetchReturn.error === undefined) {
                setAPIResponse(null);
            } else {
                setAPIResponse(fetchReturn.error);
            }
        }
    }

    return (
        <form id="enter-url-form" onSubmit={(event) => handleSubmit(event)}>
            {apiURL === null ?
                <></>
                :
                <div id="current-url-value">
                    <span>Current API URL: </span>
                    <span>{apiURL}</span>
                </div>
            }
            <div className="input-controls-container">
                <div className={"input-group" + ((apiResponse === null) ? "" : " input-invalid")}>
                    <label htmlFor="enter-url">{label}</label>
                    <input type="text" id="enter-url" autoCapitalize="none" placeholder="https://example.com/api" value={inputURL} aria-describedby="enter-url-explain" required aria-required="true"
                    onChange={(event) => handleInputChange(event)}/>
                </div>
                <input className="standard-button" type="submit" value="Validate"/>
            </div>
            {(apiResponse === null) ?
                <></>
                :
                <div className="input-error">{apiResponse}</div>
            }
        </form>
    )
}

export default EnterURLComponent;