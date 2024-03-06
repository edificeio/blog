import { Content } from "@edifice-ui/editor";
import { useUser } from "@edifice-ui/react";
import clsx from "clsx";
import { UserProfile } from "edifice-ts-client";
import { useParams } from "react-router-dom";

import { CommentCard } from "~/components/CommentCard/CommentCard";
import { useComments } from "~/hooks/useComments";
import { Comment } from "~/models/comment";

export interface CommentsCreateProps {
  comments: Comment[];
}

export const CommentsCreate = ({ comments }: CommentsCreateProps) => {
  const { user } = useUser();
  const { blogId, postId } = useParams();
  const { create } = useComments(blogId!, postId!);

  if (!user?.userId || !blogId || !postId) return <></>;

  const cssClasses = clsx("py-16", comments.length > 0 && "bg-gray-300");

  const userAsAuthor = {
    userId: user?.userId,
    username: user?.username,
    profiles: user?.type as unknown as UserProfile,
  };

  const handlePublish = (content: Content) => {
    create(content as string);
  };

  return (
    <CommentCard
      className={cssClasses}
      author={userAsAuthor}
      mode="edit"
      onPublish={handlePublish}
    />
  );
};
