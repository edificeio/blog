import { Suspense, lazy, useState } from "react";

import {
  ArrowLeft,
  Edit,
  Options,
  Print,
  TextToSpeech,
} from "@edifice-ui/icons";
import {
  Avatar,
  Button,
  IconButton,
  useDate,
  useToggle,
} from "@edifice-ui/react";
import { useTranslation } from "react-i18next";

import { usePostContext } from "./PostProvider";
import { ActionBarContainer } from "../ActionBar/ActionBarContainer";
import { Post } from "~/models/post";
import { getAvatarURL, getDatedKey } from "~/utils/PostUtils";

const DeletePostModal = lazy(
  async () => await import("~/features/Post/DeletePostModal"),
);

export interface PostHeaderProps {
  mode: "edit" | "read";
  isSpeeching?: boolean;
  onBackward: () => void;
  onPrint: () => void;
  onTts: () => void;
  onEdit: () => void;
  onPublish: () => void;
  onDelete: () => void;
}

export const PostHeader = ({
  mode,
  isSpeeching,
  onBackward,
  onPrint,
  onTts,
  onEdit,
  onPublish,
  onDelete,
}: PostHeaderProps) => {
  const { t } = useTranslation("blog");
  const { t: common_t } = useTranslation("common");
  const { fromNow } = useDate();
  const { post, mustSubmit, readOnly, canPublish } = usePostContext();

  const [isDeletePostModalOpen, setIsDeletePostModalOpen] = useState(false);
  const [isBarOpen, toggleBar] = useToggle();

  if (mode === "edit") return;

  const getDatedState = (post: Post): string =>
    t(getDatedKey(post.state), { date: fromNow(post.modified.$date) });

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mx-lg-48">
        <Button
          type="button"
          color="tertiary"
          variant="ghost"
          leftIcon={<ArrowLeft />}
          onClick={onBackward}
        >
          {common_t("back")}
        </Button>
        <div className="d-flex m-16 gap-12">
          {readOnly ? (
            <>
              <IconButton
                icon={<Print />}
                color="primary"
                variant="outline"
                aria-label={t("print")}
                onClick={onPrint}
              />
              <IconButton
                icon={<TextToSpeech />}
                color="primary"
                variant="outline"
                className={isSpeeching ? "bg-secondary" : ""}
                aria-label={t("tiptap.toolbar.tts")}
                onClick={onTts}
              />
            </>
          ) : (
            <>
              <Button leftIcon={<Edit />} onClick={onEdit}>
                {common_t("edit")}
              </Button>

              <IconButton
                variant="outline"
                icon={<Options />}
                onClick={toggleBar}
              />

              <ActionBarContainer visible={isBarOpen}>
                {canPublish ? (
                  <Button type="button" variant="filled" onClick={onPublish}>
                    {mustSubmit ? t("blog.submitPost") : t("blog.publish")}
                  </Button>
                ) : (
                  <></>
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
                  onClick={() => setIsDeletePostModalOpen(true)}
                >
                  {t("blog.delete.post")}
                </Button>
              </ActionBarContainer>
            </>
          )}
        </div>
      </div>

      <div className="d-flex flex-column mx-lg-64">
        <h2>{post.title}</h2>
        <div className="d-flex align-items-center gap-12 my-16 mt-md-8">
          <Avatar
            alt={t("post.author.avatar")}
            size="sm"
            src={getAvatarURL(post)}
            variant="circle"
          />
          <div className="text-gray-700 small gap-2 d-flex flex-column flex-md-row">
            <span>{post.author.username}</span>
            <span className="d-none d-md-block mx-8">&nbsp;|&nbsp;</span>
            <span>{getDatedState(post)}</span>
          </div>
        </div>
      </div>

      <Suspense>
        {isDeletePostModalOpen && (
          <DeletePostModal
            isOpen={isDeletePostModalOpen}
            onSuccess={onDelete}
            onCancel={() => setIsDeletePostModalOpen(false)}
          />
        )}
      </Suspense>
    </>
  );
};
