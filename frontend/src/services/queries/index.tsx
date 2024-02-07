import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { loadBlog, loadPost, loadPostsList } from "../api";
import { Post } from "~/models/post";

export const blogQuery = (blogId: string) => {
  return {
    queryKey: ["blog", blogId],
    queryFn: () => loadBlog(blogId),
  };
};

export const postQuery = (blogId: string, postId: string) => {
  return {
    queryKey: ["post", postId],
    queryFn: () => loadPost(blogId, postId),
  };
};

export const postsListQuery = (blogId: string) => {
  return {
    queryKey: ["postList", blogId],
    queryFn: ({ pageParam = 0 }) => {
      return loadPostsList(blogId, pageParam);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage: any, _allPages: any, lastPageParam: any) => {
      if (lastPage.length === 0) {
        return undefined;
      }
      return lastPageParam + 1;
    },
  };
};

/**
 * useBlog query
 * @returns blog data
 */
export const useBlog = (blogId: string) => {
  const query = useQuery(blogQuery(blogId as string));

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
  const query = useQuery(postQuery(blogId, postId));

  return {
    post: query.data,
    query,
  };
};

/**
 * usePostsList query
 * @returns list of posts metadata
 */

/* Pour rester cohérent, le hook devrait s'appeler usePosts ou alors faut renvoyer postsList mais plus court et explicite c'est = posts */
export const usePostsList = (blogId: string) => {
  const query = useInfiniteQuery(postsListQuery(blogId!));

  return {
    posts: query.data?.pages.flatMap((page) => page) as Post[],
    query,
  };
};

// /**
//  * usePostsList query
//  * @returns list of posts metadata
//  */
// export function useAllPostsList(blogId?: string) {
//   const params = useParams<{ blogId: string }>();
//   if (!blogId) {
//     blogId = params.blogId;
//   }
//   const page = 0;
//   const { setPosts } = useStoreUpdaters();
//   const posts = usePosts();
//   let query = usePostsList(blogId!, 0);
//   if (query.posts?.length && query?.posts?.length > 0) {
//     setPosts([...posts, ...query.posts]);
//   }

//   useEffect(() => {
//     query = usePostsList(blogId!, 0);
//     if (query.posts?.length && query?.posts?.length > 0) {
//       setPosts([...posts, ...query.posts]);
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [posts]);
// }
