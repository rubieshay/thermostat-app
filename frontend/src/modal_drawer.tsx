import { useEffect, useState, type SetStateAction } from "react";
import { ModalDrawerType } from "./types";
import TempModeDrawer from "./temp_mode_drawer";
import EcoModeDrawer from "./eco_mode_drawer";
import FanTimerDrawer from "./fan_timer_drawer";
import { drawerTimeoutDuration } from "./utils";

interface ModalDrawerProps {
    modalDrawer: ModalDrawerType | null,
    setModalDrawer: React.Dispatch<SetStateAction<ModalDrawerType | null>>,
    handleResetModal: (startTimer: boolean) => void
}

const ModalDrawer: React.FC<ModalDrawerProps> = ({ modalDrawer, setModalDrawer, handleResetModal }) => {
    const [controlDrawer, setControlDrawer] = useState<HTMLElement | null>(null);

    useEffect(() => {
        setControlDrawer(document.getElementById("control-drawer"));
        // document.getElementById("control-drawer")?.addEventListener("close", () => setModalDrawer(null));
    }, [setModalDrawer]);

    useEffect(() => {
        if (controlDrawer && modalDrawer) {
            (controlDrawer as HTMLDialogElement).showModal();
        }
        handleResetModal(false);
    }, [modalDrawer, controlDrawer, handleResetModal]);
    
    function handleCloseModal() {
        (controlDrawer as HTMLDialogElement).close();
    }

    return (
        // closedBy="any" not fully supported but does work in chrome if added
        <dialog id="control-drawer" className="modal-drawer" style={{"--drawer-timeout-duration": drawerTimeoutDuration + "ms"} as React.CSSProperties} onClose={() => handleResetModal(true)}>
            <button className="drawer-handle" onClick={handleCloseModal}></button>
            {modalDrawer === ModalDrawerType.tempModeModal ?
                <TempModeDrawer handleCloseModal={handleCloseModal}/>
                :
                (modalDrawer === ModalDrawerType.ecoModeModal ?
                    <EcoModeDrawer handleCloseModal={handleCloseModal}/>
                    :
                    (modalDrawer === ModalDrawerType.fanTimerModal ?
                        <FanTimerDrawer handleCloseModal={handleCloseModal}/>
                        :
                        <></>
                    )
                )
            }
        </dialog>
    );
}

export default ModalDrawer;