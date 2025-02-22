import { LoadingScreen } from '@edifice.io/react';

import { BlogHeader } from '~/features/Blog/BlogHeader';
import BlogPostList from '~/features/Blog/BlogPostList';
import BlogSidebar from '~/features/Blog/BlogSidebar';
import { useLoadPostList } from '~/hooks/useLoadPostList';
import { useBlog, useBlogCounter } from '~/services/queries';
import { BlogFilter } from './BlogFilter';

// loader : See the public-portal loader

export function Blog() {
  const { blog, publicView } = useBlog();
  const { counters } = useBlogCounter();

  useLoadPostList();

  if (!blog) return <LoadingScreen />;

  return (
    <>
      <BlogHeader blog={blog} readonly={publicView} />
      <div className="d-flex flex-fill">
        <BlogSidebar />
        <div className="flex-fill py-16 ps-md-16 d-flex flex-column">
          {!publicView && !!counters?.countAll && <BlogFilter blog={blog} />}
          <BlogPostList />
        </div>
      </div>
    </>
  );
}
