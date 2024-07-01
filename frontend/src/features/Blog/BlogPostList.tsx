import { useEffect } from "react";

import { Button, EmptyScreen, usePaths, useReactions } from "@edifice-ui/react";
import { useTranslation } from "react-i18next";

import { PostPreview } from "~/components/PostPreview/PostPreview";
import { useActionDefinitions } from "~/features/ActionBar/useActionDefinitions";
import usePostsFilter from "~/hooks/usePostsFilter";
import { PostState } from "~/models/post";
import { useBlog, useBlogCounter, usePostsList } from "~/services/queries";
import { useBlogState } from "~/store";

const BlogPostList = () => {
  const { t } = useTranslation("blog");
  const [imagePath] = usePaths();

  const { blog, publicView } = useBlog();

  const { creator, manager } = useActionDefinitions([]);
  const {
    posts,
    query: { hasNextPage, isFetching, fetchNextPage },
  } = usePostsList(
    blog?._id,
    publicView ? PostState.PUBLISHED : undefined,
    publicView ? false : undefined,
    (creator || manager) && !publicView,
  );

  const { postsFilters } = usePostsFilter();
  const { counters } = useBlogCounter(blog?._id);

  const { sidebarHighlightedPost, postsViewsCounters, postsReactionsSummary } =
    useBlogState();

  const { availableReactions } = useReactions("blog", "post");

  useEffect(() => {
    if (sidebarHighlightedPost) {
      // Scroll to the selected post
      const selectedPost = document.querySelector(".card.is-selected");
      selectedPost?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [sidebarHighlightedPost]);

  const emptyScreenTitle = (): string => {
    if (postsFilters.search) {
      return t("post.search.internal.empty");
    }
    if (counters?.countAll === 0) {
      return t("blog.empty");
    }
    if (postsFilters.state === PostState.DRAFT) {
      return t("post.state.draft.empty");
    }
    if (postsFilters.state === PostState.SUBMITTED) {
      if (creator || manager) {
        return t("post.state.submitted.contrib.empty");
      }
      return t("post.state.submitted.empty");
    }
    if (postsFilters.state === PostState.PUBLISHED) {
      return t("post.state.published.empty");
    }
    return "";
  };

  const emptyScreenText = (): string => {
    if (counters?.countAll === 0) {
      return t("blog.empty.text");
    }
    return "";
  };

  return (
    <div className="d-flex flex-column gap-24 flex-fill">
      {posts?.length === 0 && isFetching === false && (
        <div className="m-auto">
          <EmptyScreen
            imageSrc={`${imagePath}/emptyscreen/illu-blog.svg`}
            title={emptyScreenTitle()}
            text={emptyScreenText()}
          />
        </div>
      )}
      {posts?.map((post, index) => (
        <PostPreview
          key={post._id}
          post={post}
          index={index}
          views={postsViewsCounters?.[post._id]}
          reactions={{
            available: availableReactions,
            summary: postsReactionsSummary?.[post._id],
          }}
        />
      ))}
      {hasNextPage && (
        <div className="d-flex justify-content-center">
          <Button
            color="tertiary"
            variant="ghost"
            isLoading={isFetching}
            onClick={() => fetchNextPage()}
          >
            {t("post.see.more")}
          </Button>
        </div>
      )}
    </div>
  );
};

export default BlogPostList;
