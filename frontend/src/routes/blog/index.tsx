import { AppIcon, Image, LoadingScreen, useOdeClient } from "@edifice-ui/react";
import { QueryClient } from "@tanstack/react-query";
import { LoaderFunctionArgs, useParams } from "react-router-dom";

import { SummaryList } from "~/components/SummaryList/SummaryList";
import BlogHeader from "~/features/BlogHeader/BlogHeader";
import {
  blogQuery,
  postsListQuery,
  useBlog,
  usePostsList,
} from "~/services/queries";

export const blogLoader =
  (queryClient: QueryClient) =>
  async ({ params }: LoaderFunctionArgs) => {
    const queryBlog = blogQuery(params.blogId as string);
    /* TODO = maybe pass "page" as a queryParam and use https://reactrouter.com/en/main/hooks/use-search-params */
    /* https://blog.logrocket.com/use-state-url-persist-state-usesearchparams/ */
    /* this way, page is always 0! */
    const queryPostsList = postsListQuery(params.blogId as string);

    const blog =
      queryClient.getQueryData(queryBlog.queryKey) ??
      (await queryClient.fetchQuery(queryBlog));
    const posts =
      queryClient.getQueryData(queryPostsList.queryKey) ??
      (await queryClient.fetchInfiniteQuery(queryPostsList));

    return { blog, posts };
  };

export function Blog() {
  const params = useParams();

  const { currentApp } = useOdeClient();
  const { blog } = useBlog(params.blogId as string);

  // Load all posts with recursive fetchNextPage calls.
  const {
    posts,
    query: { isLoading /* fetchNextPage */ },
  } = usePostsList(params.blogId as string);

  /* const handleNextPage = useCallback(() => {
    fetchNextPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); */

  if (isLoading) return <LoadingScreen />;

  return (
    <>
      <BlogHeader />
      <div className="d-flex flex-fill">
        <div className="col-3 py-16 pe-16 border-end">
          {blog?.thumbnail ? (
            <Image
              src={blog.thumbnail}
              alt={blog.title}
              objectFit="cover"
              className="h-auto w-100 rounded"
            />
          ) : (
            <AppIcon
              app={currentApp}
              iconFit="ratio"
              size="80"
              variant="rounded"
            />
          )}
          {posts && (
            <SummaryList
              list={posts.map((post) => ({
                id: post._id,
                title: post.title,
                date: post.modified?.$date,
              }))}
            />
          )}
        </div>
        <div className="col-9 py-16 ps-16">
          <h1>List of posts</h1>
          {posts?.map((post) => (
            <div key={post._id} className="pb-8">
              <div>{post.title}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
