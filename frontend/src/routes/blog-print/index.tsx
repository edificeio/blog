import { useTrashedResource } from '@edifice.io/react';
import { QueryClient } from '@tanstack/react-query';
import { LoaderFunctionArgs, useParams } from 'react-router-dom';

import { blogActions } from '~/config/blogActions';
import { BlogPrint } from '~/features/Blog/BlogPrint';
import { useBlogErrorToast } from '~/hooks/useBlogErrorToast';
import { PostState } from '~/models/post';
import {
  availableActionsQuery,
  blogQuery,
  postsListQuery,
} from '~/services/queries';

export const loader =
  (queryClient: QueryClient) =>
  async ({ params }: LoaderFunctionArgs) => {
    const queryBlog = blogQuery(params.blogId as string);
    const actions = availableActionsQuery(blogActions);
    const queryPostsList = postsListQuery(
      params.blogId as string,
      0,
      PostState.PUBLISHED,
      undefined,
      false,
    );

    await Promise.all([
      queryClient.fetchQuery(actions),
      queryClient.fetchQuery(queryBlog),
      queryClient.fetchInfiniteQuery(queryPostsList),
    ]);

    return null;
  };

export function Component() {
  const { blogId } = useParams();

  useTrashedResource(blogId);
  useBlogErrorToast();

  return <BlogPrint />;
}
