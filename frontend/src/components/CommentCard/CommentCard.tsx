import { Comment } from "~/models/comment";

export interface CommentProps {
  comment: Comment;
}

export const CommentCard = ({ comment }: CommentProps) => {
  return <div className="border rounded-3 p-12 mb-16">{comment.comment}</div>;
};
