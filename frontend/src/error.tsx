import { useContext, useEffect, useState } from "react";
import { TempDataContext } from "./temp_context";

function Error() {
    const {fetchTempData, lastAPIError,clearAPIError} = useContext(TempDataContext);
    const [errorText, setErrorText] = useState<string>("");

    useEffect( () => {
        setErrorText(String(lastAPIError.fetchReturn.error));
        if (!lastAPIError.lastErrorWasFetch) {
        clearAPIError();
        fetchTempData();
        }
    },[lastAPIError.errorSeq]);
    
    return (
        <h1>{errorText}</h1>
    );
}

export default Error;