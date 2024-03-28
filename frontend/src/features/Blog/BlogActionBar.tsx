import { Suspense, lazy, useEffect, useState } from "react";

import { Options, Plus } from "@edifice-ui/icons";
import { Button, IconButton, useToggle } from "@edifice-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import { ACTION, ActionType } from "edifice-ts-client";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { ButtonGroup } from "~/components/ButtonGroup/ButtonGroup";
import { ActionBarContainer } from "~/features/ActionBar/ActionBarContainer";
import { useBlogActions } from "~/features/ActionBar/useBlogActions";
import { Blog } from "~/models/blog";
import { baseUrl } from "~/routes";
import { blogQuery, useDeleteBlog } from "~/services/queries";
import { useBlogState, useStoreUpdaters } from "~/store";

export interface BlogActionBarProps {
  blog: Blog;
}

const UpdateModal = lazy(
  async () => await import("~/features/ActionBar/Modal/ResourceModal"),
);

const BlogPublic = lazy(
  async () => await import("~/features/ActionBar/Modal/BlogPublic"),
);

const DeleteModal = lazy(
  async () => await import("~/components/ConfirmModal/ConfirmModal"),
);

const PublishModal = lazy(
  async () => await import("~/features/ActionBar/Modal/PublishModal"),
);

const ShareModal = lazy(
  async () => await import("~/features/ActionBar/Modal/ShareModal"),
);

const ShareBlog = lazy(
  async () => await import("~/features/ActionBar/Modal/ShareBlog"),
);

export const BlogActionBar = ({ blog }: BlogActionBarProps) => {
  const { t } = useTranslation("blog");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { actions: availableActions, canContrib } = useBlogActions(blog);
  const { setActionBarPostId } = useStoreUpdaters();
  const { actionBarPostId } = useBlogState();

  const [isBarOpen, setBarOpen] = useState(false);
  const [isUpdateModalOpen, toogleUpdateModalOpen] = useToggle();
  const [isShareModalOpen, toogleShareModalOpen] = useToggle();
  const [isPublishModalOpen, tooglePublishModalOpen] = useToggle();
  const [isDeleteModalOpen, toogleDeleteModalOpen] = useToggle();

  useEffect(() => {
    if (actionBarPostId) {
      setBarOpen(false);
    }
  }, [actionBarPostId]);

  const invalidateQueries = () => {
    queryClient.invalidateQueries(blogQuery(blog._id));
  };

  const deleteMutation = useDeleteBlog(blog._id);

  const handleOpenMenuClick = () => {
    setActionBarPostId();
    setBarOpen((prev) => !prev);
  };

  const handleAddClick = () => {
    navigate(`./post/edit`);
  };

  const handleEditClick = () => {
    toogleUpdateModalOpen();
  };

  const handleEditClose = () => {
    toogleUpdateModalOpen();
  };

  const handleEditSuccess = () => {
    invalidateQueries();
    handleEditClose();
    setBarOpen(false);
  };

  const handleDeleteClick = () => {
    toogleDeleteModalOpen();
  };

  const handleDeleteClose = () => {
    toogleDeleteModalOpen();
    setBarOpen(false);
  };

  const handleDeleteSuccess = () => {
    deleteMutation.mutateAsync().then(() => {
      navigate("../..");
    });
  };

  const handlePublishClick = () => {
    tooglePublishModalOpen();
  };

  const handlePublishClose = () => {
    tooglePublishModalOpen();
    setBarOpen(false);
  };

  const handleShareClick = () => {
    toogleShareModalOpen();
  };

  const handleShareClose = () => {
    toogleShareModalOpen();
    setBarOpen(false);
  };

  const handleShareSuccess = () => {
    invalidateQueries();
    handleShareClose();
    setBarOpen(false);
  };

  const handlePrintClick = () => {
    if (blog.visibility === "PUBLIC" && blog.slug) {
      // Public print
      window.open(`${baseUrl}/pub/${blog.slug}/print`, "_blank");
    } else {
      window.open(`${baseUrl}/print/${blog._id}`, "_blank");
    }
    setBarOpen(false);
  };

  function isActionAvailable(action: ActionType) {
    return availableActions?.some((act) => act.id === action);
  }

  return (
    <>
      <ButtonGroup className="gap-12 align-self-end">
        {canContrib && (
          <Button
            leftIcon={<Plus />}
            onClick={handleAddClick}
            className="text-nowrap"
          >
            {t("blog.create.post")}
          </Button>
        )}

        <IconButton
          color="primary"
          variant="outline"
          icon={<Options />}
          onClick={handleOpenMenuClick}
        />

        <ActionBarContainer visible={isBarOpen}>
          {isActionAvailable(ACTION.EDIT) ? (
            <Button
              type="button"
              color="primary"
              variant="filled"
              onClick={handleEditClick}
            >
              {t("blog.edit.title")}
            </Button>
          ) : (
            <></>
          )}
          {isActionAvailable(ACTION.SHARE) ? (
            <Button
              type="button"
              color="primary"
              variant="filled"
              onClick={handleShareClick}
            >
              {t("share")}
            </Button>
          ) : (
            <></>
          )}
          {isActionAvailable(ACTION.PUBLISH) ? (
            <Button
              type="button"
              color="primary"
              variant="filled"
              onClick={handlePublishClick}
            >
              {t("blog.publish")}
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
          {isActionAvailable(ACTION.DELETE) ? (
            <Button
              type="button"
              color="primary"
              variant="filled"
              onClick={handleDeleteClick}
            >
              {t("blog.delete")}
            </Button>
          ) : (
            <></>
          )}
        </ActionBarContainer>
      </ButtonGroup>

      <Suspense>
        {isUpdateModalOpen && (
          <UpdateModal
            mode="update"
            isOpen={isUpdateModalOpen}
            resourceId={blog._id}
            onCancel={handleEditClose}
            onSuccess={handleEditSuccess}
          >
            {(resource, isUpdating, watch, setValue, register) =>
              isActionAvailable(ACTION.CREATE_PUBLIC) && (
                <BlogPublic
                  appCode="blog"
                  isUpdating={isUpdating}
                  resource={resource}
                  watch={watch}
                  setValue={setValue}
                  register={register}
                />
              )
            }
          </UpdateModal>
        )}
        {isShareModalOpen && (
          <ShareModal
            isOpen={isShareModalOpen}
            resourceId={blog._id}
            onCancel={handleShareClose}
            onSuccess={handleShareSuccess}
          >
            {(ressource) => <ShareBlog resource={ressource} />}
          </ShareModal>
        )}
        {isPublishModalOpen && (
          <PublishModal
            isOpen={isPublishModalOpen}
            resourceId={blog._id}
            onCancel={handlePublishClose}
            onSuccess={handlePublishClose}
          />
        )}
        {isDeleteModalOpen && (
          <DeleteModal
            id="confirmDeleteModal"
            isOpen={isDeleteModalOpen}
            header={<>{t("blog.delete")}</>}
            body={
              <p className="body">
                <p>{t("confirm.remove.blog")}</p>
                {blog.visibility === "PUBLIC" &&
                  t("confirm.remove.blog.publication")}
              </p>
            }
            onSuccess={handleDeleteSuccess}
            onCancel={handleDeleteClose}
          />
        )}
      </Suspense>
    </>
  );
};
