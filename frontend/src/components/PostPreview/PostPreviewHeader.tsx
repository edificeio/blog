/* eslint-disable jsx-a11y/click-events-have-key-events */

import { Avatar, Badge } from "@edifice-ui/react";
import { useTranslation } from "react-i18next";

import { useActionDefinitions } from "~/features/ActionBar/useActionDefinitions";
import { PostDate } from "~/features/Post/PostDate";
import { Post, PostState } from "~/models/post";
import { getAvatarURL } from "~/utils/PostUtils";

export type PostPreviewHeaderProps = {
  /**
   * Post to display
   */
  post: Post;
};

export const PostPreviewHeader = ({ post }: PostPreviewHeaderProps) => {
  const { t } = useTranslation("blog");

  const { contrib, manager, creator } = useActionDefinitions([]);

  return (
    <div className="d-flex gap-12">
      <div className="blog-post-user-image">
        <Avatar
          alt={t("blog.author.avatar")}
          size="md"
          src={getAvatarURL(post.author.userId)}
          variant="circle"
        />
      </div>
      <div className="d-flex flex-column gap-2">
        <div className="d-flex align-items-center">
          <h4 className="post-preview-title">{post.title}</h4>
          {post.state === PostState.DRAFT &&
            (creator || manager || contrib) && (
              <Badge
                className="ms-8"
                variant={{
                  type: "notification",
                  level: "info",
                  color: "text",
                }}
              >
                {t("draft")}
              </Badge>
            )}
          {post.state === PostState.SUBMITTED && (
            <Badge
              className="blog-post-badge ms-8"
              variant={{
                type: "notification",
                level: "warning",
                color: "text",
              }}
            >
              {t("blog.filters.submitted")}
            </Badge>
          )}
        </div>
        <div className="text-gray-700 small column-gap-12 d-flex flex-column flex-md-row align-items-md-center">
          <span>{post.author.username}</span>
          <PostDate post={post} shortDisplay={true}></PostDate>
        </div>
      </div>
    </div>
  );
};
