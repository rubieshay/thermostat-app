import { useContext, useState, type FormEvent } from "react";
import { APIContext } from "./contexts/api_context";
import { useNavigate } from "react-router";

function Settings() {
    const {setAPIURL, validateURL, setAPIValidated} = useContext(APIContext);
    const [inputURL, setInputURL] = useState<string>("");
    const navigate = useNavigate();

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        const isValid = await validateURL(inputURL);
        if (isValid) {
            console.log("valid api");
            await setAPIURL(inputURL);
            setAPIValidated();
            navigate("/", {replace: true});
        } else {
            console.log("invalid api");
        }
    }

    return (
        <form onSubmit={(event) => handleSubmit(event)}>
            <div>
                <label id="input-url-label">Input API URL</label>
                <input type="text" value={inputURL} aria-labelledby="input-url-label"
                onChange={(event) => setInputURL(event.target.value)}/>
            </div>
            <input type="submit"/>
        </form>
    )
}

export default Settings;