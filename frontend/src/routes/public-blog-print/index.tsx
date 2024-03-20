import { useEffect } from "react";

import { Editor } from "@edifice-ui/editor";
import { LoadingScreen } from "@edifice-ui/react";

import { BlogHeader } from "~/features/Blog/BlogHeader";
import { PostTitle } from "~/features/Post/PostTitle";
import { PostState } from "~/models/post";
import { useBlog, usePostsList } from "~/services/queries";

export function Component() {
  const { blog } = useBlog();

  const {
    posts,
    query: { fetchNextPage, hasNextPage, isSuccess, data },
  } = usePostsList(blog?._id, PostState.PUBLISHED, false);

  useEffect(() => {
    // Load all posts with recurcive fetchNextPage calls.
    if (isSuccess) {
      if (hasNextPage) {
        fetchNextPage();
      } else {
        window.print();
      }
    }
  }, [hasNextPage, isSuccess, fetchNextPage, data]);

  if (!blog) return <LoadingScreen />;

  return (
    <>
      <div className="px-16">
        <BlogHeader blog={blog} print={true} />
      </div>
      {!isSuccess && hasNextPage && <LoadingScreen />}
      <div className="d-flex flex-fill bg-white">
        <div className="flex-fill py-16 ps-16 d-flex flex-column gap-16">
          {posts.map((post) => (
            <div key={post._id} className="rounded border pt-16">
              <PostTitle post={post} mode="print" />
              <div className="mx-32">
                <Editor
                  content={post.content}
                  mode="read"
                  variant="ghost"
                ></Editor>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
