import { useModalStore } from "../../store/useModalStore";
import { useOzipzDb } from "../../hooks/useOzipzDb";
import { CoreEntityModals } from "./CoreEntityModals";
import { RegistryAdminModals } from "./RegistryAdminModals";

export function OzipzModalRoot() {
  const { activeModal, payload, closeModal } = useModalStore();
  const db = useOzipzDb();

  return (
    <>
      <CoreEntityModals
        activeModal={activeModal}
        payload={payload}
        closeModal={closeModal}
        db={db}
      />
      <RegistryAdminModals
        activeModal={activeModal}
        payload={payload}
        closeModal={closeModal}
        db={db}
      />
    </>
  );
}
