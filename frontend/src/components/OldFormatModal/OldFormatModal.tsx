import { useId, useState } from 'react';

import { Button, LoadingScreen, Modal } from '@edifice.io/react';
import { useTranslation } from 'react-i18next';

import { baseUrl } from '~/routes';

interface OldFormatModalProps {
  blogId: string;
  postId: string;
  isOpen: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function OldFormatModal({
  blogId,
  postId,
  isOpen,
  onCancel = () => ({}),
}: OldFormatModalProps) {
  const { t } = useTranslation('common');
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <Modal
      viewport
      isOpen={isOpen}
      onModalClose={onCancel}
      id={useId()}
      size="lg"
    >
      <Modal.Header onModalClose={onCancel}>
        {t('post.oldFormat.title', { ns: 'blog' })}
      </Modal.Header>
      <Modal.Body className="d-flex flex-fill align-content-center justify-content-center ">
        {!isLoaded && (
          <div className="position-absolute top-0 start-0 bottom-0 end-0 d-flex align-items-center justify-content-center bg-white z-index-1">
            <LoadingScreen />
          </div>
        )}
        <iframe
          className="flex-fill"
          src={`${baseUrl}/oldformat/${blogId}/${postId}`}
          title={t('post.oldFormat.title', { ns: 'blog' })}
          onLoad={() => setIsLoaded(true)}
        ></iframe>
      </Modal.Body>
      <Modal.Footer>
        <Button color="secondary" onClick={onCancel}>
          {t('close')}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
