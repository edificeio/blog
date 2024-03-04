import { useEffect, useMemo, useState } from "react";

import { EditorContent, useCommentEditor } from "@edifice-ui/editor";
import { Send } from "@edifice-ui/icons";
import {
  Avatar,
  Badge,
  Button,
  CoreDate,
  useDate,
  useUser,
} from "@edifice-ui/react";
import clsx from "clsx";
import { ACTION, ID, IUserDescription } from "edifice-ts-client";
import { useTranslation } from "react-i18next";

import { postCommentActions } from "~/config/postCommentActions";
import { useActionDefinitions } from "~/features/ActionBar/useActionDefinitions";
import { getAvatarURL } from "~/utils/PostUtils";

const MAX_COMMENT_LENGTH = 800;

export interface CommentProps {
  className?: string;
  mode: "edit" | "read" | "print";

  author: {
    userId: ID;
    username: string;
    profiles?: IUserDescription["profiles"];
  };

  created?: CoreDate;

  content?: any /*FIXME Content*/;

  onEdit?: () => void;
  onRemove?: () => void;
  onPublish?: (content: any /*FIXME Content*/) => void;
  onCancel?: () => void;
}

export const CommentCard = ({
  author,
  created,
  content,
  mode,
  className,
}: CommentProps) => {
  const [editable, setEditable] = useState(mode === "edit");

  const { t } = useTranslation("common");
  const { fromNow } = useDate();
  const { editor, commentLength } = useCommentEditor(
    editable,
    content ?? "",
    MAX_COMMENT_LENGTH,
  );
  const { user } = useUser();
  const { hasRight, manager: isManager } =
    useActionDefinitions(postCommentActions);

  const badge = useMemo(() => {
    const profile = author.profiles?.[0] ?? "Guest";
    if (["Teacher", "Student", "Relative", "Personnel"].indexOf(profile) < 0)
      return <></>;

    return (
      <Badge
        variant={{
          type: "profile",
          //@ts-ignore -- Checked above
          profile: profile.toLowerCase(),
        }}
      >
        {t(profile)}
      </Badge>
    );
  }, [author.profiles, t]);

  // When content is updated through props, render it.
  useEffect(() => {
    editor?.commands.setContent(content);
  }, [content, editor?.commands]);

  // When editable flag is changing, so does the corresponding editor's property.
  useEffect(() => {
    editor?.setEditable(editable);
  }, [editable, editor]);

  if (!editor) return <></>;

  // Can the current user edit this post ?
  const canEdit = author.userId === user?.userId && hasRight(ACTION.COMMENT);

  const handleEditClick = () => {
    setEditable(true);
  };
  const handleRemoveClick = () => {
    alert("remove!");
  };

  return (
    <div className={clsx("border rounded-3 p-12 d-flex", className)}>
      <Avatar
        alt={t("comment.author.avatar")}
        size="sm"
        src={getAvatarURL(author.userId)}
        variant="circle"
      />
      <div className="d-flex flex-column flex-grow-1">
        <div className="ms-8">
          {editable ? (
            <div className="d-flex flex-column flex-fill gap-8">
              <div>{t("comment.placeholder")}</div>
              <div className="border rounded-3 px-16 pt-12 pb-8 d-flex gap-2 flex-column bg-white">
                <EditorContent editor={editor}></EditorContent>
                <div className="d-flex gap-12 justify-content-end align-items-center">
                  <span className="small text-gray-700">
                    {commentLength} / {MAX_COMMENT_LENGTH}
                  </span>
                  <Button leftIcon={<Send />} variant="ghost" size="lg">
                    {t("comment.post")}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="ms-2">
              <div className="mb-8 d-flex text-gray-700 small gap-8">
                <span>{author.username}</span>
                {badge}
                {created && (
                  <>
                    <span className="d-none d-md-block mx-8">|</span>
                    <span>
                      {t("comment.publish.date", { date: fromNow(created) })}
                    </span>
                  </>
                )}
              </div>
              <EditorContent editor={editor}></EditorContent>
            </div>
          )}
        </div>

        {mode !== "print" && !editable && (
          <div>
            {canEdit && (
              <Button
                variant="ghost"
                color="tertiary"
                size="sm"
                onClick={handleEditClick}
              >
                {t("edit")}
              </Button>
            )}
            {(canEdit || isManager) && (
              <Button
                variant="ghost"
                color="tertiary"
                size="sm"
                onClick={handleRemoveClick}
              >
                {t("remove")}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
