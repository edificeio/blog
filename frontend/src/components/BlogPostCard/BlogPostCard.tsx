/* eslint-disable jsx-a11y/click-events-have-key-events */
import { useEffect, useRef, useState } from "react";

import { Editor, EditorRef } from "@edifice-ui/editor";
import { Avatar, Badge, Card, Image, useDate } from "@edifice-ui/react";
import clsx from "clsx";
import { odeServices } from "edifice-ts-client";
import { useTranslation } from "react-i18next";

import { useActionDefinitions } from "~/features/ActionBar/useActionDefinitions";
import { Post, PostState } from "~/models/post";
import { useSidebarHighlightedPost } from "~/store";

export type BlogPostCardProps = {
  /**
   * Post to display
   */
  post: Post;

  /**
   * Action on click
   */
  onClick?: (post: Post) => void;
};

export const BlogPostCard = ({ post, onClick }: BlogPostCardProps) => {
  const { fromNow } = useDate();
  const { t } = useTranslation();
  const directoryService = odeServices.directory();
  const sidebarHighlightedPost = useSidebarHighlightedPost();
  const editorRef = useRef<EditorRef>(null);
  const { contrib, manager, creator } = useActionDefinitions([]);

  // Number of media to display on the preview card
  const MAX_NUMBER_MEDIA_DISPLAY = 3;
  // // Check size of screen to display the right number of media base on breakpoint
  const [summaryContent, setSummaryContent] = useState<string>("");
  const [mediaURLs, setMediaURLs] = useState<string[]>([]);

  const getAvatarURL = (post: Post): string => {
    return directoryService.getAvatarUrl(post.author.userId, "user");
  };

  const displayDate = (date: string) => {
    return fromNow(date);
  };

  const handleOnClick = (post: Post) => {
    console.log("handleOnClick", post);
    onClick?.(post);
  };

  useEffect(() => {
    let contentHTML = post.content;
    if (contentHTML) {
      const getMediaTags = /<(img|video|iframe|audio|embed)[^>]*>(<\/\1>)?/gim;
      const getSrc = /src=(?:"|')([^"|']*)(?:"|')/;
      const haveEmptyTags = /<([^>|/]*)\s*[^>]*>\s*\S*(&nbsp;)*<\/\1>/gim;
      const getSummaryTags =
        /<([h1,h2,h3,h4,h5,p,div]+)\s*[^>]*>((?!<\/\1).)*<\/\1>/gim;
      const mediaTags = contentHTML.match(getMediaTags);
      contentHTML = contentHTML.replace(getMediaTags, "");
      if (mediaTags?.length) {
        setMediaURLs(
          mediaTags
            .filter((tag) => tag.includes("img"))
            .map((tag) => {
              const srcMatch = getSrc.exec(tag);
              return srcMatch?.length ? srcMatch[1] : "";
            }) || [],
        );
      }

      while (haveEmptyTags.test(contentHTML)) {
        contentHTML = contentHTML.replace(haveEmptyTags, "");
      }

      // Check if line clamp is supported by the browser else cut the content
      if (!CSS.supports("-webkit-line-clamp: 2")) {
        setSummaryContent(contentHTML);
      } else {
        // Cut with js the 2 first tag of the content
        const summary = contentHTML.match(getSummaryTags);
        setSummaryContent(
          summary && summary?.length > 2
            ? summary.slice(0, 2)?.join("") + "..."
            : summary?.join("") || "",
        );
      }
    }
  }, [post]);

  const classes = clsx("p-24", {
    "blog-post-badge-highlight": post._id === sidebarHighlightedPost?._id,
  });

  return (
    <Card
      className={classes}
      onClick={() => {
        handleOnClick(post);
      }}
    >
      <div className="d-flex gap-12">
        <div className="blog-post-user-image">
          <Avatar
            alt={t("Avatar utilisateur")}
            size="md"
            src={getAvatarURL(post)}
            variant="circle"
          />
        </div>
        <div className="d-flex flex-column">
          <h5 className="d-flex align-items-center">
            {post.title}
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
                  {t("Brouillon")}
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
                {t(creator || manager ? "À valider" : "Envoyés")}
              </Badge>
            )}
          </h5>
          <div className="text-gray-700 small gap-4 d-flex flex-column flex-md-row ">
            <div>{post.author.username}</div>
            <div className="d-none d-md-block ">|</div>
            <div>{t("Envoyé le") + " " + displayDate(post.modified.$date)}</div>
          </div>
        </div>
      </div>
      <Card.Body space="0">
        <div className="d-flex flex-fill flex-column gap-16 py-16">
          <div className="flex-fill blog-post-preview">
            <Editor
              ref={editorRef}
              content={summaryContent}
              mode="read"
              variant="ghost"
            />
          </div>
          <div className="d-flex align-items-center justify-content-center gap-24 mx-32">
            {mediaURLs.slice(0, MAX_NUMBER_MEDIA_DISPLAY).map((url, index) => (
              <div
                className={clsx("blog-post-image", {
                  "d-none d-md-block": index >= 1,
                })}
                key={url}
              >
                <Image
                  alt=""
                  objectFit="cover"
                  ratio="16"
                  className="rounded"
                  src={url}
                />
                {(index === 0 || index === 2) &&
                  mediaURLs.length - (index + 1) > 0 && (
                    <div
                      className={clsx(
                        "position-absolute top-0 bottom-0 start-0 end-0 d-flex justify-content-center align-items-center rounded text-light bg-dark bg-opacity-50",
                        {
                          "d-flex d-md-none": index === 0,
                          "d-none d-md-flex": index === 2,
                        },
                      )}
                    >
                      + {mediaURLs.length - (index + 1)} {t("images")}
                    </div>
                  )}
              </div>
            ))}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};
