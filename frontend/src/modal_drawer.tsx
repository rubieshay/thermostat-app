import { useEffect, useState, type SetStateAction } from "react";
import { ModalDrawerType } from "./types";
import TempModeDrawer from "./temp_mode_drawer";
import EcoModeDrawer from "./eco_mode_drawer";
import FanTimerDrawer from "./fan_timer_drawer";

interface ModalDrawerProps {
    modalDrawer: ModalDrawerType | null
    setModalDrawer: React.Dispatch<SetStateAction<ModalDrawerType | null>>
}

const ModalDrawer: React.FC<ModalDrawerProps> = ({ modalDrawer, setModalDrawer }) => {
    const [controlDrawer, setControlDrawer] = useState<HTMLElement | null>(null);

    useEffect(() => {
        setControlDrawer(document.getElementById("control-drawer"));
        document.getElementById("control-drawer")?.addEventListener("close", () => setModalDrawer(null));
    }, [setModalDrawer]);

    useEffect(() => {
        if (controlDrawer && modalDrawer) {
            (controlDrawer as HTMLDialogElement).showModal();
        }
    }, [modalDrawer, controlDrawer]);
    
    function handleCloseModal() {
        (controlDrawer as HTMLDialogElement).close();
    }

    return (
        <dialog id="control-drawer" className="modal-drawer" onClose={() => 
        setModalDrawer(null)}>
            <button className="drawer-handle" onClick={handleCloseModal}>Close</button>
            {modalDrawer === ModalDrawerType.tempModeModal ?
                <TempModeDrawer/>
                :
                (modalDrawer === ModalDrawerType.ecoModeModal ?
                    <EcoModeDrawer/>
                    :
                    (modalDrawer === ModalDrawerType.fanTimerModal ?
                        <FanTimerDrawer/>
                        :
                        <></>
                    )
                )
            }
        </dialog>
    );
}

export default ModalDrawer;