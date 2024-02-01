import { LoadingScreen } from "@edifice-ui/react";
import { QueryClient } from "@tanstack/react-query";
import { LoaderFunctionArgs, useParams } from "react-router-dom";

import BlogContent from "~/features/BlogContent/BlogContent";
import BlogHeader from "~/features/BlogHeader/BlogHeader";
import { blogQuery, useBlog } from "~/services/queries";
import { useStoreUpdaters } from "~/store";

export async function blogViewLoader(
  { params }: LoaderFunctionArgs,
  queryClient: QueryClient,
) {
  const { blogId } = params;
  return queryClient.fetchQuery(blogQuery(blogId!));
}

export const BlogView = () => {
  const { blogId } = useParams();
  const { setBlog } = useStoreUpdaters();

  const { blog } = useBlog(blogId!);
  setBlog(blog);

  if (!blog) return <LoadingScreen />;

  return (
    <>
      <BlogHeader />
      <BlogContent />
    </>
  );
};
