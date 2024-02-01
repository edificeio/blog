import { Image } from "@edifice-ui/react";

import { useBlog } from "~/store";

const BlogContent = () => {
  const blog = useBlog();

  // TODO load default image if no thumbnail
  if (!blog) return <div>Default image here</div>;
  return <Image src={blog.thumbnail} alt={blog.title} />;
};

export default BlogContent;
