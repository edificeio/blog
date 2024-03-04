import { useUser } from "@edifice-ui/react";
import clsx from "clsx";
import { UserProfile } from "edifice-ts-client";

import { CommentCard } from "~/components/CommentCard/CommentCard";
import { Comment } from "~/models/comment";

export interface CommentsCreateProps {
  comments: Comment[];
}

export const CommentsCreate = ({ comments }: CommentsCreateProps) => {
  const { user } = useUser();
  if (!user?.userId) return <></>;

  const cssClasses = clsx("py-16", comments.length > 0 && "bg-gray-300");

  const userAsAuthor = {
    userId: user?.userId,
    username: user?.username,
    profiles: user?.type as unknown as UserProfile,
  };

  return (
    <CommentCard className={cssClasses} author={userAsAuthor} mode="edit" />
  );
};
