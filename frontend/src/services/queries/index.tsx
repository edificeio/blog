import { useQuery } from "@tanstack/react-query";
import { odeServices } from "edifice-ts-client";

import { Blog } from "~/store/models/blog";
import { Post } from "~/store/models/post";

/**
 * useBlog query
 * @returns blog data
 */
export const useBlog = (id: string) => {
  const query = useQuery({
    queryKey: ["blog", id],
    queryFn: async () => await odeServices.http().get<Blog>(`/blog/${id}`),
  });

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
