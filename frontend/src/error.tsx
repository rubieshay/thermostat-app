import { useContext, useEffect, useState, useRef } from "react";
import { TempDataContext } from "./temp_data_context";

function Error() {
    const { fetchTempData, lastAPIError, clearAPIError } = useContext(TempDataContext);
    const [errorText, setErrorText] = useState<string>("");
    const errorDialogRef = useRef<HTMLDialogElement | null>(null);

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
        (errorDialogRef?.current as HTMLDialogElement).showModal();
    }, [lastAPIError.errorSeq, clearAPIError, fetchTempData, lastAPIError]);
    
    function handleCloseModal() {
        (errorDialogRef.current as HTMLDialogElement).close();
    }

    return (
        <dialog id="error-dialog" ref={errorDialogRef} className="modal-popup">
            <h2>Error Occurred:</h2>
            <p>{errorText}</p>
            <button onClick={handleCloseModal} className="modal-close-button">Close</button>
        </dialog>
    );
}

export default Error;