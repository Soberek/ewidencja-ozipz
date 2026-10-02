import { useModalStore, type ModalState } from "../../store/useModalStore";
import { useOzipzDb } from "../../hooks/useOzipzDb";
import { CoreEntityModals } from "./CoreEntityModals";
import { RegistryAdminModals } from "./RegistryAdminModals";

export function OzipzModalRoot() {
  const { activeModal, payload, closeModal } = useModalStore();
  if (!activeModal) return null;
  return <ActiveOzipzModal activeModal={activeModal} payload={payload} closeModal={closeModal} />;
}

function ActiveOzipzModal({ activeModal, payload, closeModal }: Pick<ModalState, "activeModal" | "payload" | "closeModal">) {
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
