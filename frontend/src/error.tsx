import { useContext, useEffect, useState } from "react";
import { TempDataContext } from "./temp_context";

function Error() {
    const {fetchTempData, selectedTempData: tempData,lastAPIError,clearAPIError} = useContext(TempDataContext);
    const [errorText, setErrorText] = useState<string>("");
    const serialError = JSON.stringify(lastAPIError);

    useEffect( () => {
        if (lastAPIError.errorSeq === 0) {return;};
        console.log("Error Sequence incremented... lastAPIError:",structuredClone(lastAPIError));
        setErrorText(String(lastAPIError.fetchReturn.error));
        if (!lastAPIError.lastErrorWasFetch) {
            clearAPIError();
            fetchTempData();
        }
    },[serialError]);
    
    useEffect( () => {
        console.log("Current temp data is: ",structuredClone(tempData))

    },[tempData])

    return (
        <h1>{errorText}</h1>
    );
};

export default Error;