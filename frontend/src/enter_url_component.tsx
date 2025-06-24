import { useContext, useState, type ChangeEvent, type FormEvent } from "react";
import { APIContext } from "./contexts/api_context";
import { useNavigate } from "react-router";

function EnterURLComponent({ navLink, label } : {navLink: string | null, label: string}) {
    const {setAPIURL, validateURL, setAPIValidated} = useContext(APIContext);
    const [inputURL, setInputURL] = useState<string>("");
    const [apiResponse, setAPIResponse] = useState<string | null>(null);
    const navigate = useNavigate();

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
        <>
            <form id="enter-url-form" onSubmit={(event) => handleSubmit(event)}>
                <div className={"input-group" + ((apiResponse === null) ? "" : " input-invalid")}>
                    <label htmlFor="enter-url">{label}</label>
                    <input type="text" autoCapitalize="none" value={inputURL} id="enter-url" aria-describedby="enter-url-explain" required aria-required="true"
                    onChange={(event) => handleInputChange(event)}/>
                </div>
                <input className="standard-button" type="submit" value="Validate"/>
                {(apiResponse === null) ?
                    <></>
                    :
                    <div className="input-error">{apiResponse}</div>
                }
                {/* <div className="input-error">
                    {apiResponse === null ?
                        ""
                        :
                        apiResponse
                    }
                </div> */}
            </form>
        </>
    )
}

export default EnterURLComponent;