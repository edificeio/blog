import { Suspense, lazy, useEffect } from "react";

import { Button, useToggle } from "@edifice-ui/react";
import { ACTION } from "edifice-ts-client";
import { useTranslation } from "react-i18next";

import { postContentActions } from "~/config/postContentActions";
import { ActionBarContainer } from "~/features/ActionBar/ActionBarContainer";
import { usePostActions } from "~/features/ActionBar/usePostActions";
import { Post, PostState } from "~/models/post";
import { useDeletePost, useGoUpPost } from "~/services/queries";
import { useActionBarPostId } from "~/store";

const DeleteModal = lazy(
  async () => await import("~/components/ConfirmModal/ConfirmModal"),
);

export interface PostPreviewActionBarProps {
  /**
   * Blog id of the post.
   */
  blogId: string;
  /**
   * Post to be previewed.
   */
  post: Post;
  /**
   * Index of the post in the list of posts.
   */
  index: number;
}

export const PostPreviewActionBar = ({
  blogId,
  post,
  index,
}: PostPreviewActionBarProps) => {
  // Get available actions and requirements for the post.
  const postActions = usePostActions(postContentActions, blogId, post);
  const { mustSubmit, isActionAvailable } = postActions;

  const deleteMutation = useDeletePost(blogId, post._id);
  const goUpMutation = useGoUpPost(blogId, post._id);
  const { t } = useTranslation("blog");

  const [isDeleteModalOpen, toogleDeleteModalOpen] = useToggle();

  const actionBarPostId = useActionBarPostId();
  const [isActionBarOpen, toogleActionBarOpen] = useToggle();

  useEffect(() => {
    if (actionBarPostId === post._id) {
      toogleActionBarOpen(() => true);
    } else {
      toogleActionBarOpen(() => true);
    }
  }, [actionBarPostId, post._id, toogleActionBarOpen]);

  const handlePrintClick = () => {
    window.open(`/print/${blogId}/post/${post._id}`, "_blank");
  };

  const handlePublish = () => {};

  const handleGoUp = () => {
    goUpMutation.mutate();
  };

  const handleDeleteSuccess = () => {
    deleteMutation.mutateAsync().then(() => {
      toogleDeleteModalOpen(false);
    });
  };

  const handleDeleteClose = () => {
    toogleDeleteModalOpen(false);
  };

  return (
    <>
      <ActionBarContainer visible={isActionBarOpen}>
        {post.state !== PostState.PUBLISHED &&
        isActionAvailable(ACTION.PUBLISH) ? (
          <Button type="button" variant="filled" onClick={handlePublish}>
            {mustSubmit ? t("blog.submitPost") : t("blog.publish")}
          </Button>
        ) : (
          <></>
        )}
        {post.state === PostState.PUBLISHED &&
        isActionAvailable(ACTION.MOVE) &&
        index > 0 ? (
          <Button type="button" variant="filled" onClick={handleGoUp}>
            {t("goUp")}
          </Button>
        ) : (
          <></>
        )}
        <Button
          type="button"
          color="primary"
          variant="filled"
          onClick={handlePrintClick}
        >
          {t("blog.print")}
        </Button>
        <Button
          type="button"
          color="primary"
          variant="filled"
          onClick={() => toogleDeleteModalOpen(true)}
        >
          {t("blog.delete.post")}
        </Button>
      </ActionBarContainer>

      <Suspense>
        {isDeleteModalOpen && (
          <DeleteModal
            id="confirmDeleteModal"
            isOpen={isDeleteModalOpen}
            header={<>{t("blog.delete.post")}</>}
            body={<p className="body">{t("confirm.remove.post")}</p>}
            onSuccess={handleDeleteSuccess}
            onCancel={handleDeleteClose}
          />
        )}
      </Suspense>
    </>
  );
};
