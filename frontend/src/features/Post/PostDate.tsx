import { useDate } from "@edifice-ui/react";
import { useTranslation } from "react-i18next";

import { Post, PostState } from "~/models/post";

export interface PostDateProps {
  // The post to display the date for
  post: Post;

  // Whether to display only the published date and the last modified date
  shortDisplay?: boolean;
}

export const PostDate = ({ post, shortDisplay }: PostDateProps) => {
  const { t } = useTranslation("blog");
  const { fromNow } = useDate();

  const getDatedKey = (state: PostState): string => {
    switch (state) {
      case "SUBMITTED":
        return "post.dated.submitted";
      default:
        return "post.dated.draft";
    }
  };

  const displayModifiedDate =
    post.state !== PostState.PUBLISHED ||
    (!shortDisplay &&
      post.modified.$date > (post.firstPublishDate?.$date || 0));

  return (
    <>
      {post.state === PostState.PUBLISHED && post.firstPublishDate && (
        <>
          <span className="separator d-none d-md-block"></span>
          <span>
            {t("post.dated.published", {
              date: fromNow(post.firstPublishDate),
            })}
          </span>
        </>
      )}
      {displayModifiedDate && (
        <>
          <span className="separator d-none d-md-block"></span>
          <span>
            {t(getDatedKey(post.state), {
              date: fromNow(post.modified),
            })}
          </span>
        </>
      )}
    </>
  );
};