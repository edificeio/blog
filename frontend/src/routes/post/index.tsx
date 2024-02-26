import { QueryClient, useQuery } from "@tanstack/react-query";
import { LoaderFunctionArgs, useLoaderData, useParams } from "react-router-dom";

import { postContentActions } from "~/config/postContentActions";
import { BlogHeader } from "~/features/BlogHeader/BlogHeader";
import { PostContent } from "~/features/Post/PostContent";
import { PostProvider } from "~/features/Post/PostProvider";
import { PostMetadata } from "~/models/post";
import { loadPostMetadata } from "~/services/api";
import { availableActionsQuery, postQuery } from "~/services/queries";

/** Load a blog post content */
export const loader =
  (queryClient: QueryClient) =>
  async ({ params }: LoaderFunctionArgs) => {
    const { blogId, postId } = params;
    // Prefetch some data, if not done already
    const actions = availableActionsQuery(postContentActions);
    await queryClient.fetchQuery(actions);

    if (blogId && postId) {
      return await loadPostMetadata(blogId, postId);
    }

    return null;
  };

export function Component() {
  const { blogId } = useParams();
  const postMetadata = useLoaderData() as PostMetadata; // see loader above
  const query = useQuery(postQuery(blogId!, postMetadata));

  if (!blogId || !query.data) {
    return <></>;
  }

  return (
    <PostProvider blogId={blogId} post={query.data}>
      <BlogHeader />
      <PostContent />
    </PostProvider>
  );
}
