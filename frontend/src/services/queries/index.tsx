import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

import { loadBlog, loadBlogCounter, loadPost, loadPostsList } from "../api";
import { Post, PostState } from "~/models/post";
import { usePostPageSize, usePostsFilters } from "~/store";

export const blogQuery = (blogId: string) => {
  return {
    queryKey: ["blog", blogId],
    queryFn: () => loadBlog(blogId),
  };
};

export const blogCounterQuery = (blogId: string) => {
  return {
    queryKey: ["blog", "counter", blogId],
    queryFn: () => loadBlogCounter(blogId),
  };
};

export const postQuery = (blogId: string, postId: string) => {
  return {
    queryKey: ["post", postId],
    queryFn: () => loadPost(blogId, postId),
  };
};

export const postsListQuery = (
  blogId: string,
  pageSize?: number,
  search?: string,
  states?: PostState[],
) => {
  const queryKey: any = { blogId };
  if (search) {
    queryKey.search = search;
  }
  if (states && states.length > 0) {
    queryKey.states = states;
  }
  return {
    queryKey: ["postList", queryKey],
    queryFn: ({ pageParam = 0 }) =>
      loadPostsList(blogId, pageParam, search, states),
    initialPageParam: 0,
    getNextPageParam: (lastPage: any, _allPages: any, lastPageParam: any) => {
      if (
        (pageSize && lastPage.length < pageSize) ||
        (!pageSize && lastPage.length === 0)
      ) {
        return undefined;
      }
      return lastPageParam + 1;
    },
    keepPreviousData: true,
  };
};

/**
 * useBlog query
 * @param blogId the blog id string
 * @returns blog data
 */
export const useBlog = (blogId?: string) => {
  const params = useParams<{ blogId: string }>();
  if (!blogId) {
    if (!params.blogId) {
      console.error("blogId is not defined");
    }
    blogId = params.blogId;
  }
  const query = useQuery(blogQuery(blogId!));

  return {
    blog: query.data,
    query,
  };
};

/**
 * useBlogCounter query
 * @param blogId the blog id string
 * @returns counters of posts by state for on specific blogId
 */
export const useBlogCounter = (blogId?: string) => {
  const params = useParams<{ blogId: string }>();
  if (!blogId) {
    if (!params.blogId) {
      console.error("blogId is not defined");
    }
    blogId = params.blogId;
  }
  const query = useQuery(blogCounterQuery(blogId!));

  return {
    counters: query.data,
    query,
  };
};

/**
 * usePost query
 * @param blogId the blog id string
 * @param postId the post id string
 * @returns post data
 */
export const usePost = (blogId: string, postId: string) => {
  const query = useQuery(postQuery(blogId, postId));

  return {
    post: query.data,
    query,
  };
};

/**
 * useMetadataPostsList query
 * @param blogId the blog id string
 * @returns list of posts metadata
 */
export const usePostsList = (blogId?: string) => {
  const params = useParams<{ blogId: string }>();
  const { states, search } = usePostsFilters();
  const pageSize = usePostPageSize();

  if (!blogId) {
    if (!params.blogId) {
      console.error("blogId is not defined");
    }
    blogId = params.blogId;
  }

  const query = useInfiniteQuery(
    postsListQuery(blogId!, pageSize, search, states),
  );

  return {
    posts: query.data?.pages.flatMap((page) => page) as Post[],
    query,
  };
};
