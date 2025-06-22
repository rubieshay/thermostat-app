import { useEffect, useRef } from "react";
import { ModalDrawerType } from "./types";
import TempModeDrawer from "./modal_drawers/temp_mode_drawer";
import EcoModeDrawer from "./modal_drawers/eco_mode_drawer";
import FanTimerDrawer from "./modal_drawers/fan_timer_drawer";
import { drawerTimeoutDuration } from "./utils/constants";

interface ModalDrawerProps {
    modalDrawerType: ModalDrawerType | null,
    handleResetModal: (startTimer: boolean) => void
}

const ModalDrawer: React.FC<ModalDrawerProps> = ({ modalDrawerType, handleResetModal }) => {
    const controlDrawerRef = useRef<HTMLDialogElement | null>(null);

    useEffect(() => {
        if (controlDrawerRef && modalDrawerType) {
            (controlDrawerRef.current as HTMLDialogElement).showModal();
        }
        handleResetModal(false);
    }, [modalDrawerType, handleResetModal]);
    
    function handleCloseModal() {
        (controlDrawerRef.current as HTMLDialogElement).close();
    }

    return (
        // closedBy="any" not fully supported but does work in chrome if added
        <dialog id="control-drawer" ref={controlDrawerRef} className="modal-drawer" style={{"--drawer-timeout-duration": drawerTimeoutDuration + "ms"} as React.CSSProperties} onClose={() => handleResetModal(true)}>
            <button className="drawer-handle" onClick={handleCloseModal}></button>
            {modalDrawerType === ModalDrawerType.tempModeModal ?
                <TempModeDrawer handleCloseModal={handleCloseModal}/>
                :
                (modalDrawerType === ModalDrawerType.ecoModeModal ?
                    <EcoModeDrawer handleCloseModal={handleCloseModal}/>
                    :
                    (modalDrawerType === ModalDrawerType.fanTimerModal ?
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