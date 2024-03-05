import { EmptyScreen, usePaths } from "@edifice-ui/react";
import { useTranslation } from "react-i18next";

import { CommentCard } from "~/components/CommentCard/CommentCard";
import { Comment } from "~/models/comment";

export interface CommentsListProps {
  comments: Comment[];
}

export const CommentsList = ({ comments }: CommentsListProps) => {
  const [imagePath] = usePaths();
  const { t } = useTranslation("blog");

  return comments.length ? (
    <div className="mb-48">
      {comments.map((comment) => (
        <CommentCard
          key={comment.id}
          className="mt-16"
          author={comment.author}
          content={comment.comment}
          mode="read"
          created={comment.created}
        />
      ))}
    </div>
  ) : (
    <div className="m-auto">
      <EmptyScreen
        imageSrc={`${imagePath}/emptyscreen/illu-pad.svg`}
        text={t("blog.comment.emptyscreen.text")}
      />
    </div>
  );
};
