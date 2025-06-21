import { useContext, useState, type FormEvent } from "react";
import { APIContext } from "./api_context";
import { useNavigate } from "react-router";

function EnterURL() {
    const {setAPIURL, validateURL, setAPIValidated} = useContext(APIContext);
    const [inputURL, setInputURL] = useState<string>("");
    const navigate = useNavigate();

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        const isValid = await validateURL(inputURL);
        if (isValid) {
            setInputURL("");
            console.log("valid api");
            await setAPIURL(inputURL);
            setAPIValidated();
            navigate("/", {replace: true});
        } else {
            console.log("invalid api");
        }
    }

    return (
        <main id="input-url-page" className="centered-page">
            <div className="icon-title">
                <img src="/icon.svg"/>
                <h1>ThermoPal</h1>
            </div>
            <form onSubmit={(event) => handleSubmit(event)}>
                <div id="input-url-explain">An API URL was not automatically detected. Please enter it below.</div>
                <div className="input-group">
                    <label htmlFor="input-url">API URL</label>
                    <input type="text" value={inputURL} id="input-url" aria-describedby="input-url-explain"
                    onChange={(event) => setInputURL(event.target.value)}/>
                </div>
                <input className="standard-button" type="submit" value="Validate"/>
            </form>
        </main>
    )
}

export default EnterURL;