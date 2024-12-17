import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useToast } from '@edifice.io/react';
import { useTranslation } from 'react-i18next';
import { postsListQuery } from '.';
import {
  createComment,
  deleteComment,
  loadComments,
  updateComment,
} from '../api';

/** Query comments data. */
export const commentListQuery = (blogId: string, postId: string) => {
  return {
    queryKey: ['comments', blogId, postId],
    queryFn: () => loadComments(blogId, postId),
  };
};

export const useCreateComment = (blogId: string, postId: string) => {
  const { t } = useTranslation();

  const toast = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ content }: { content: string }) =>
      createComment(blogId, postId, content),
    onSuccess: () => {
      Promise.all([
        queryClient.invalidateQueries(commentListQuery(blogId, postId)),
        queryClient.invalidateQueries(postsListQuery(blogId)),
      ]);
      toast.success(t('blog.create.comment.success'));
    },
    onError: (error) => {
      toast.error(t('blog.create.comment.error'));
      console.error(error);
    },
  });
};

export const useUpdateComment = (blogId: string, postId: string) => {
  const { t } = useTranslation();

  const toast = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      comment,
      commentId,
    }: {
      comment: string;
      commentId: string;
    }) => updateComment(blogId, postId, comment, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries(commentListQuery(blogId, postId));
      toast.success(t('blog.update.comment.success'));
    },
    onError: (error) => {
      toast.error(t('blog.update.comment.error'));
      console.error(error);
    },
  });
};

export const useDeleteComment = (blogId: string, postId: string) => {
  const { t } = useTranslation();

  const toast = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId }: { commentId: string }) =>
      deleteComment(blogId, postId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries(commentListQuery(blogId, postId));
      toast.success(t('blog.delete.comment.success'));
    },
    onError: (error) => {
      toast.error(t('blog.delete.comment.error'));
      console.error(error);
    },
  });
};
