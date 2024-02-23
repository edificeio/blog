import { Modal, Button } from "@edifice-ui/react";
import { useTranslation } from "react-i18next";

interface ModalProps {
  isOpen: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function DeletePostModal({
  isOpen,
  onSuccess = () => ({}),
  onCancel = () => ({}),
}: ModalProps) {
  const { t } = useTranslation("blog");
  return (
    <Modal isOpen={isOpen} onModalClose={onCancel} id="deletePostModal">
      <Modal.Header onModalClose={onCancel}>
        {t("blog.delete.post")}
      </Modal.Header>
      <Modal.Body>
        <p className="body">{t("confirm.remove.post")}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button
          color="tertiary"
          onClick={onCancel}
          type="button"
          variant="ghost"
        >
          {t("no")}
        </Button>
        <Button
          color="danger"
          onClick={onSuccess}
          type="button"
          variant="filled"
        >
          {t("yes")}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
