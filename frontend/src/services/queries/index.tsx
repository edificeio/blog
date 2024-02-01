import { useQuery } from "@tanstack/react-query";
import { odeServices } from "edifice-ts-client";

import { Blog } from "~/models/blog";
import { Post } from "~/models/post";

/**
 * blogQuery
 * @returns blog query
 */
export const blogQuery = (blogId: string) => {
  return {
    queryKey: ["blog", blogId],
    queryFn: async () => await odeServices.http().get<Blog>(`/blog/${blogId}`),
  };
};

/**
 * useBlog query
 * @returns blog data
 */
export const useBlog = (blogId: string) => {
  const query = useQuery(blogQuery(blogId));

  return {
    blog: query.data,
    query,
  };
};

/**
 * usePost query
 * @returns post data
 */
export const usePost = (blogId: string, postId: string) => {
  const query = useQuery({
    queryKey: ["post", postId],
    queryFn: async () =>
      await odeServices
        .http()
        .get<Post>(`/blog/post/${blogId}/${postId}?state=PUBLISHED/`),
  });

  return {
    post: query.data,
    query,
  };
};
