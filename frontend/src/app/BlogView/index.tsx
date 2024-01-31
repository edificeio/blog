import { useParams } from "react-router-dom";

import { useBlog } from "~/services/queries";
import { useStoreUpdaters } from "~/store";

export const BlogView = () => {
  const { blogId } = useParams();
  const { setBlog } = useStoreUpdaters();

  const { data: blog } = useBlog(blogId!);
  setBlog(blog);

  return <div></div>;
};
