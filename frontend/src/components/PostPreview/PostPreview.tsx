import { useCallback, useEffect, useRef, useState } from 'react';

import { Card, Image } from '@edifice.io/react';
import { Editor, EditorRef } from '@edifice.io/react/editor';
import { getThumbnail } from '@edifice.io/utilities';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';

import { Post } from '~/models/post';
import { useBlog } from '~/services/queries';
import { useBlogStore } from '~/store';
import { PostPreviewActionBar } from './PostPreviewActionBar';
import { PostPreviewFooter } from './PostPreviewFooter';
import { PostPreviewHeader } from './PostPreviewHeader';

export type PostPreviewProps = {
  /**
   * Post to display
   */
  post: Post;
  /**
   * Index of the post in the list
   */
  index: number;
};

export const PostPreview = ({ post, index }: PostPreviewProps) => {
  const { t } = useTranslation('blog');
  const navigate = useNavigate();

  const { blog, publicView } = useBlog();
  const { actionBarPostId, setActionBarPostId, sidebarHighlightedPost } =
    useBlogStore(
      useShallow((state) => ({
        sidebarHighlightedPost: state.sidebarHighlightedPost,
        actionBarPostId: state.actionBarPostId,
        setActionBarPostId: state.setActionBarPostId,
      })),
    );

  const editorRef = useRef<EditorRef>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const [summaryContent, setSummaryContent] = useState<string>('');
  const [summaryContentPlain, setSummaryContentPlain] = useState<string>('');
  const [mediaURLs, setMediaURLs] = useState<string[]>([]);

  // Number of media to display on the preview card
  const MAX_NUMBER_MEDIA_DISPLAY = 3;

  const handleCardSelect = useCallback(() => {
    if (actionBarPostId === post._id) {
      setActionBarPostId();
    } else {
      setActionBarPostId(post._id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionBarPostId]);

  useEffect(() => {
    if (sidebarHighlightedPost?._id === post._id) {
      cardRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      });
    }
  }, [sidebarHighlightedPost, post]);

  useEffect(() => {
    let contentHTML = post.content;
    if (contentHTML) {
      const getMediaTags = /<(img|video|iframe|audio|embed)[^>]*>(<\/\1>)?/gim;
      const getSrc = /src=(?:"|')([^"|']*)(?:"|')/;
      const mediaTags = contentHTML.match(getMediaTags);
      contentHTML = contentHTML.replace(getMediaTags, '');
      if (mediaTags?.length) {
        setMediaURLs(
          mediaTags
            .filter((tag) => tag.includes('img'))
            .map((tag) => {
              const srcMatch = getSrc.exec(tag);
              if (srcMatch?.length) {
                return getThumbnail(srcMatch[1], 0, 300);
              }
              return '';
            }) || [],
        );
      }

      setSummaryContent(contentHTML);
    }
  }, [post]);

  useEffect(() => {
    if (editorRef.current?.getContent('plain')) {
      const plainText =
        editorRef.current
          ?.getContent('plain')
          ?.replace(/\u200B/g, '')
          ?.replace(/((&nbsp;)|\s)((&nbsp;)|\s)+/g, ' ') || '';
      setSummaryContentPlain(plainText);
    }
  }, [editorRef, summaryContent]);

  const handleClickGoDetail = () => {
    navigate(`./post/${post?._id}`);
  };

  const classes = clsx('p-24', {
    'blog-post-badge-highlight': post._id === sidebarHighlightedPost?._id,
  });

  return (
    <>
      <Card
        className={classes}
        isSelected={actionBarPostId === post._id}
        onSelect={() => {
          handleCardSelect();
        }}
        isSelectable={true}
        ref={cardRef}
        isClickable={false}
      >
        <PostPreviewHeader post={post} />
        <Card.Body space="0">
          <div className="d-flex flex-fill flex-column">
            <div className="d-none">
              <Editor
                ref={editorRef}
                content={summaryContent}
                mode="read"
                variant="ghost"
              />
            </div>
            <div
              onClick={handleClickGoDetail}
              tabIndex={-1}
              role="button"
              className="flex-fill text-truncate text-truncate-2 post-preview-content pt-16"
            >
              {summaryContentPlain}
            </div>
            <div
              onClick={handleClickGoDetail}
              tabIndex={-1}
              role="button"
              className="d-flex align-items-center justify-content-center gap-24 px-32 pt-16"
            >
              {mediaURLs
                .slice(0, MAX_NUMBER_MEDIA_DISPLAY)
                .map((url, index) => (
                  <div
                    className={clsx('blog-post-image col-12 col-md-4 ', {
                      'd-none d-md-block': index >= 1,
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
                            'position-absolute top-0 bottom-0 start-0 end-0 d-flex justify-content-center align-items-center rounded text-light bg-dark bg-opacity-50',
                            {
                              'd-flex d-md-none': index === 0,
                              'd-none d-md-flex': index === 2,
                            },
                          )}
                        >
                          + {mediaURLs.length - (index + 1)}{' '}
                          {t('post.preview.media')}
                        </div>
                      )}
                  </div>
                ))}
            </div>
            <PostPreviewFooter post={post} />
          </div>
        </Card.Body>
      </Card>
      {blog && post && (
        <PostPreviewActionBar
          post={post}
          blog={blog}
          index={index}
          publicView={publicView}
        ></PostPreviewActionBar>
      )}
    </>
  );
};
