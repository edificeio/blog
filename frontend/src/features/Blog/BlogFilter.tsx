import { useEffect, useState } from 'react';

import {
  Badge,
  SearchBar,
  Toolbar,
  ToolbarItem,
  useDebounce,
} from '@edifice.io/react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

import usePostsFilter from '~/hooks/usePostsFilter';
import { Blog } from '~/models/blog';
import { PostState } from '~/models/post';
import { useBlogCounter } from '~/services/queries';
import { useActionDefinitions } from '../ActionBar/useActionDefinitions';

export interface BlogFilterProps {
  blog: Blog;
}

export const BlogFilter = ({ blog }: BlogFilterProps) => {
  const { t } = useTranslation('blog');
  const { postsFilters, setPostsFilters } = usePostsFilter();

  const [search, setSearch] = useState<string>(postsFilters.search || '');
  const [state, setState] = useState<PostState>(postsFilters.state);
  const debounceSearch = useDebounce(search, 300);

  const { counters } = useBlogCounter();
  const { contrib, manager, creator } = useActionDefinitions([]);

  const handlerSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newText = event.target.value;
    setSearch(newText.toString());
  };

  const handleFilter = (filterState: PostState) => {
    setState(filterState);
  };

  useEffect(() => {
    setPostsFilters({
      search: debounceSearch,
      state: state,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounceSearch, state]);

  const filterToolbar: ToolbarItem[] = [
    {
      type: 'button',
      name: 'published',
      props: {
        className: clsx('fw-normal h-full py-4 px-8 fs-6', {
          'bg-secondary-200 fw-bold': state === PostState.PUBLISHED,
        }),
        children: (
          <span>
            {t('blog.filters.published', { count: counters?.countPublished })}
          </span>
        ),
        onClick: () => {
          handleFilter(PostState.PUBLISHED);
        },
      },
    },
    {
      type: 'button',
      name: 'submitted',
      visibility: blog['publish-type'] === 'RESTRAINT' ? 'show' : 'hide',
      props: {
        className: clsx('fw-normal h-full py-4 px-8 fs-6', {
          'bg-secondary-200 fw-bold': state === PostState.SUBMITTED,
        }),
        children: (
          <>
            <span>{t('blog.filters.submitted')} </span>
            {counters?.countSubmitted ? (
              <Badge
                variant={{
                  level: 'warning',
                  type: 'notification',
                }}
                style={{ height: 'auto' }}
              >
                {counters.countSubmitted}
              </Badge>
            ) : (
              0
            )}
          </>
        ),
        onClick: () => {
          handleFilter(PostState.SUBMITTED);
        },
      },
    },
    {
      type: 'button',
      name: 'draft',
      props: {
        className: clsx('fw-normal h-full py-4 px-8 fs-6', {
          'bg-secondary-200 fw-bold': state === PostState.DRAFT,
        }),
        children: (
          <span>
            {t('blog.filters.drafts', { count: counters?.countDraft })}
          </span>
        ),
        onClick: () => {
          handleFilter(PostState.DRAFT);
        },
      },
    },
  ];
  return (
    <div className="d-flex pb-16">
      <SearchBar
        isVariant
        className="d-none d-md-flex flex-fill"
        onChange={handlerSearch}
        placeholder={t('blog.search.bar.placeholder')}
        size="md"
      />
      {(manager || creator || contrib) && (
        <Toolbar
          variant="no-shadow"
          className="px-4 py-2 ms-md-16 border border-secondary-200 rounded-3 blog-filter-toolbar flex-nowrap row-gap-4 overflow-auto align-items-stretch"
          items={filterToolbar}
        ></Toolbar>
      )}
    </div>
  );
};
