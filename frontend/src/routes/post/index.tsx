import { QueryClient } from "@tanstack/react-query";
import { LoaderFunctionArgs } from "react-router-dom";

import { postContentActions } from "~/config/postContentActions";
import { PostContent } from "~/features/PostContent/PostContent";
import { PostHeader } from "~/features/PostHeader/PostHeader";
import { Post } from "~/models/post";
import {
  availableActionsQuery,
  postQuery,
  useBlog,
  usePost,
} from "~/services/queries";

/** Load a blog post content */
export const loader =
  (queryClient: QueryClient) =>
  async ({ params }: LoaderFunctionArgs) => {
    const { blogId, postId } = params;
    // Prefetch some data, if not done already
    const actions = availableActionsQuery(postContentActions);
    await queryClient.fetchQuery(actions);

    if (blogId && postId) {
      const query = postQuery(blogId, postId);
      return {
        post:
          queryClient.getQueryData<Post | null>(query.queryKey) ??
          (await queryClient.fetchQuery(query)),
      };
    }
    return { post: null };
  };

export function Component() {
  const { blog } = useBlog();
  const { post } = usePost();

  if (!blog || !post) {
    return <></>;
  }

  return (
    <>
      <PostHeader post={post}></PostHeader>
      <PostContent blog={blog} post={post}></PostContent>
    </>
  );
}
