import { AppIcon, Image, useOdeClient } from "@edifice-ui/react";

import { BlogFilter } from "../BlogFilter/BlogFilter";
import { SummaryList } from "~/components/SummaryList/SummaryList";
import { useBlog, useMetadataPostsList } from "~/services/queries";

const BlogContent = () => {
  const { blog } = useBlog();
  const { posts } = useMetadataPostsList();
  const { currentApp } = useOdeClient();

  return (
    <>
      <div className="d-flex flex-fill">
        <div className="col-3 py-16 pe-16 border-end">
          {blog?.thumbnail ? (
            <Image
              src={blog.thumbnail}
              alt={blog.title}
              objectFit="cover"
              className="h-auto w-100 rounded"
            />
          ) : (
            <AppIcon
              app={currentApp}
              iconFit="ratio"
              size="80"
              variant="rounded"
            />
          )}
          {posts && (
            <SummaryList
              list={posts.map((post) => ({
                id: post._id,
                title: post.title,
                date: post.modified?.$date,
              }))}
            />
          )}
        </div>
        <div className="col-9 py-16 ps-16">
          <BlogFilter />
          <h1>List of posts</h1>
          {posts?.map((post) => (
            <div key={post._id} className="pb-8">
              <div>{post.title}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default BlogContent;
