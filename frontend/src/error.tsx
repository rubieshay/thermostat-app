import { useContext, useEffect, useState } from "react";
import { TempDataContext } from "./temp_context";

function Error() {
    const { fetchTempData, lastAPIError, clearAPIError } = useContext(TempDataContext);
    const [errorText, setErrorText] = useState<string>("");
    const [errorDialog, setErrorDialog] = useState<HTMLElement | null>(null);

    useEffect(() => {
        if (lastAPIError.errorSeq === 0) {
            return;
        }
        console.log("Error Sequence incremented... lastAPIError:", structuredClone(lastAPIError));
        const newErrorText = String(lastAPIError.fetchReturn.error);
        setErrorText(newErrorText);
        if (!lastAPIError.lastErrorWasFetch) {
            clearAPIError();
            fetchTempData(true);
        }
        if (errorDialog) {
            (errorDialog as HTMLDialogElement).showModal();
        }
    }, [lastAPIError.errorSeq, clearAPIError, fetchTempData, lastAPIError, errorDialog]);

    useEffect(() => {
        setErrorDialog(document.getElementById("error-dialog"));
    }, [errorDialog]);
    
    function handleCloseModal() {
        (errorDialog as HTMLDialogElement).close();
    }

    return (
        <dialog id="error-dialog">
            <h2>Error Occurred:</h2>
            <p>{errorText}</p>
            <button onClick={handleCloseModal}>Close</button>
        </dialog>
    );
}

export default Error;