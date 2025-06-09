import { useContext, useEffect, useState } from "react";
import { TempDataContext } from "./temp_context";

function Error() {
    const {fetchTempData,lastAPIError,clearAPIError} = useContext(TempDataContext);
    const [errorText, setErrorText] = useState<string>("");

    useEffect( () => {
        if (lastAPIError.errorSeq === 0) {return;};
        console.log("Error Sequence incremented... lastAPIError:",structuredClone(lastAPIError));
        setErrorText(String(lastAPIError.fetchReturn.error));
        if (!lastAPIError.lastErrorWasFetch) {
            clearAPIError();
            fetchTempData(true);
        }
    },[lastAPIError.errorSeq,clearAPIError,fetchTempData,lastAPIError]);
    
    return (
        <h1>{errorText}</h1>
    );
};

export default Error;