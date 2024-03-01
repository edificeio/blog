import { useEffect, useMemo } from "react";

import { CommentEditor, useCommentEditor } from "@edifice-ui/editor";
import {
  Avatar,
  Badge,
  Button,
  CoreDate,
  useDate,
  useUser,
} from "@edifice-ui/react";
import clsx from "clsx";
import { ACTION, ID } from "edifice-ts-client";
import { useTranslation } from "react-i18next";

import { postCommentActions } from "~/config/postCommentActions";
import { useActionDefinitions } from "~/features/ActionBar/useActionDefinitions";

export interface CommentProps {
  className?: string;
  author: {
    userId: ID;
    username: string;
    login?: string;
  };
  created: CoreDate;
  content: any /*FIXME Content*/;

  mode: "edit" | "read";
  showEditButton?: boolean;
  showRemoveButton?: boolean;

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
  const editable = mode === "edit";

  const { t } = useTranslation("common");
  const { fromNow } = useDate();
  const { editor } = useCommentEditor(editable, content);
  const { user, avatar, userDescription } = useUser();
  const { hasRight, manager: isManager } =
    useActionDefinitions(postCommentActions);

  const badge = useMemo(() => {
    const userProfile = userDescription?.profiles[0] || "Guest";
    if (
      ["Teacher", "Student", "Relative", "Personnel"].indexOf(userProfile) < 0
    )
      return <></>;
    return (
      <Badge
        variant={{
          type: "profile",
          //@ts-ignore -- Checked above
          profile: userProfile.toLowerCase(),
        }}
      >
        {t(userProfile)}
      </Badge>
    );
  }, [t, userDescription?.profiles]);

  // When content is updated, render it.
  useEffect(() => {
    editor?.commands.setContent(content);
  }, [content, editor?.commands]);

  // When editable mode changes, so does the editor.
  useEffect(() => {
    editor?.setEditable(editable);
  }, [editable, editor]);

  if (!editor) return <></>;

  const handleEditClick = () => {};
  const isCommentAuthor =
    author.userId === user?.userId && hasRight(ACTION.COMMENT);

  return (
    <div className={clsx("border rounded-3 p-12 d-flex", className)}>
      <Avatar
        alt={t("author.avatar")}
        size="sm"
        src={avatar}
        variant="circle"
      />
      <div className="ms-4 d-flex flex-column">
        <div className="ms-8">
          <div className="mb-8 d-flex text-gray-700 small gap-8">
            <span className="ms-2">{author.username}</span>
            {badge}
            <span className="d-none d-md-block mx-8">|</span>
            <span>{t("publish.date", { date: fromNow(created) })}</span>
          </div>
          <CommentEditor editor={editor} editable={editable}></CommentEditor>
        </div>
        <div>
          {isCommentAuthor && (
            <Button variant="ghost" color="tertiary" size="sm">
              {t("edit")}
            </Button>
          )}
          {(isCommentAuthor || isManager) && (
            <Button variant="ghost" color="tertiary" size="sm">
              {t("remove")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
