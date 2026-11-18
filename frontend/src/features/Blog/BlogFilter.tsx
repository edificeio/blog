import { useEffect, useState } from 'react';

import {
  Badge,
  SearchBar,
  SegmentedControl,
  SegmentedOption,
  useDebounce,
} from '@edifice.io/react';
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

  const filterOptions: SegmentedOption[] = [
    {
      label: t('blog.filters.published', { count: counters?.countPublished }),
      value: PostState.PUBLISHED,
    },
    ...(blog['publish-type'] === 'RESTRAINT'
      ? [
          {
            label: t('blog.filters.submitted'),
            value: PostState.SUBMITTED,
            badge: counters?.countSubmitted ? (
              <Badge
                variant={{
                  level: 'warning',
                  type: 'notification',
                }}
                style={{ height: 'auto' }}
                data-testid="blog-filter-submitted-badge"
              >
                {counters.countSubmitted}
              </Badge>
            ) : (
              <span>0</span>
            ),
          },
        ]
      : []),
    {
      label: t('blog.filters.drafts', { count: counters?.countDraft }),
      value: PostState.DRAFT,
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
        data-testid="blog-filter-search-input"
      />
      {(manager || creator || contrib) && (
        <SegmentedControl
          className="ms-md-16"
          data-testid="blog-filter-state-segmented"
          options={filterOptions}
          value={state}
          onChange={(value) => handleFilter(value as PostState)}
        />
      )}
    </div>
  );
};
