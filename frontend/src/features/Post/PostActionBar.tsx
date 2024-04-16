import { Suspense, lazy, useState } from "react";

import { Edit, Options, Send } from "@edifice-ui/icons";
import { Button, IconButton, useToggle } from "@edifice-ui/react";
import { useTranslation } from "react-i18next";

import { ActionBarContainer } from "../ActionBar/ActionBarContainer";
import { PostActions } from "../ActionBar/usePostActions";
import { Post, PostState } from "~/models/post";

const ConfirmModal = lazy(
  async () => await import("~/components/ConfirmModal/ConfirmModal"),
);

export interface PostActionBarProps {
  post: Post;
  postActions?: PostActions;
  isSpeeching?: boolean;
  onPrint?: () => void;
  onEdit?: () => void;
  onPublish?: () => void;
  onDelete?: () => void;
}

export const PostActionBar = ({
  post,
  postActions,
  onPrint,
  onEdit,
  onPublish,
  onDelete,
}: PostActionBarProps) => {
  const { t } = useTranslation("blog");
  const { t: common_t } = useTranslation("common");
  const { mustSubmit, canPublish, isMutating } = postActions || {};

  const [isBarOpen, toggleBar] = useToggle();

  const [confirmDeleteModal, setConfirmDeleteModal] = useState(false);

  const shouldBeSubmitted =
    mustSubmit && post.state === PostState.DRAFT && canPublish;
  const shouldBePublished =
    !mustSubmit && post.state !== PostState.PUBLISHED && canPublish;

  // Is `edit` the main action ?
  const isMainActionEdit = !shouldBePublished;

  return (
    <>
      {isMainActionEdit ? (
        <Button leftIcon={<Edit />} onClick={onEdit}>
          {common_t("edit")}
        </Button>
      ) : (
        <Button leftIcon={<Send />} onClick={onPublish}>
          {t("blog.publish")}
        </Button>
      )}

      <IconButton variant="outline" icon={<Options />} onClick={toggleBar} />

      <ActionBarContainer visible={isBarOpen}>
        {shouldBeSubmitted && (
          <Button
            type="button"
            variant="filled"
            disabled={isMutating}
            onClick={onPublish}
          >
            {t("blog.submitPost")}
          </Button>
        )}
        {isMainActionEdit ? (
          <Button
            type="button"
            variant="filled"
            disabled={isMutating}
            onClick={onPublish}
          >
            {t("blog.publish")}
          </Button>
        ) : (
          <Button
            type="button"
            variant="filled"
            disabled={isMutating}
            onClick={onEdit}
          >
            {common_t("edit")}
          </Button>
        )}
        <Button
          type="button"
          color="primary"
          variant="filled"
          onClick={onPrint}
        >
          {t("blog.print")}
        </Button>

        <Button
          type="button"
          color="primary"
          variant="filled"
          onClick={() => setConfirmDeleteModal(true)}
        >
          {t("blog.delete.post")}
        </Button>
      </ActionBarContainer>

      <Suspense>
        {confirmDeleteModal && (
          <ConfirmModal
            id="confirmDeleteModal"
            isOpen={confirmDeleteModal}
            header={<>{t("blog.delete.post")}</>}
            body={<p className="body">{t("confirm.remove.post")}</p>}
            onSuccess={onDelete}
            onCancel={() => setConfirmDeleteModal(false)}
          />
        )}
      </Suspense>
    </>
  );
};
