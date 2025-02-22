import { useEffect } from 'react';

import { Button, EmptyScreen } from '@edifice.io/react';
import { useTranslation } from 'react-i18next';

import illuBlog from '@images/emptyscreen/illu-blog.svg';
import { PostPreview } from '~/components/PostPreview/PostPreview';
import { useActionDefinitions } from '~/features/ActionBar/useActionDefinitions';
import usePostsFilter from '~/hooks/usePostsFilter';
import { PostState } from '~/models/post';
import { useBlog, useBlogCounter, usePostsList } from '~/services/queries';
import { useBlogStore } from '~/store';

const BlogPostList = () => {
  const { t } = useTranslation('blog');

  const { blog, publicView } = useBlog();

  const { creator, manager } = useActionDefinitions([]);
  const {
    posts,
    query: { hasNextPage, isFetching, fetchNextPage },
  } = usePostsList({
    blogId: blog?._id,
    state: publicView ? PostState.PUBLISHED : undefined,
    withNbComments: publicView ? false : true,
    withViews: (creator || manager) && !publicView,
  });

  const { postsFilters } = usePostsFilter();
  const { counters } = useBlogCounter(blog?._id);

  const sidebarHighlightedPost = useBlogStore(
    (state) => state.sidebarHighlightedPost,
  );

  useEffect(() => {
    if (sidebarHighlightedPost) {
      // Scroll to the selected post
      const selectedPost = document.querySelector('.card.is-selected');
      selectedPost?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [sidebarHighlightedPost]);

  const emptyScreenTitle = (): string => {
    if (postsFilters.search) {
      return t('post.search.internal.empty');
    }
    if (counters?.countAll === 0) {
      return t('blog.empty');
    }
    if (postsFilters.state === PostState.DRAFT) {
      return t('post.state.draft.empty');
    }
    if (postsFilters.state === PostState.SUBMITTED) {
      if (creator || manager) {
        return t('post.state.submitted.contrib.empty');
      }
      return t('post.state.submitted.empty');
    }
    if (postsFilters.state === PostState.PUBLISHED) {
      return t('post.state.published.empty');
    }
    return '';
  };

  const emptyScreenText = (): string => {
    if (counters?.countAll === 0) {
      return t('blog.empty.text');
    }
    return '';
  };

  return (
    <div className="d-flex flex-column gap-24 flex-fill">
      {posts?.length === 0 && isFetching === false && (
        <div className="m-auto">
          <EmptyScreen
            imageSrc={illuBlog}
            title={emptyScreenTitle()}
            text={emptyScreenText()}
          />
        </div>
      )}
      {posts?.map((post, index) => (
        <PostPreview key={post._id} post={post} index={index} />
      ))}
      {hasNextPage && (
        <div className="d-flex justify-content-center">
          <Button
            color="tertiary"
            variant="ghost"
            isLoading={isFetching}
            onClick={() => fetchNextPage()}
          >
            {t('post.see.more')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default BlogPostList;
