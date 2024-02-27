import { CommentCard } from "~/components/CommentCard/CommentCard";
import { Comment } from "~/models/comment";

export interface CommentsListProps {
  comments: Comment[];
}

export const CommentsList = ({ comments }: CommentsListProps) =>
  comments.length ? (
    <div className="mt-16">
      {comments.map((comment) => (
        <CommentCard key={comment.id} comment={comment} />
      ))}
    </div>
  ) : (
    <></>
  );
