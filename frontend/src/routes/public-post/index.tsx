import { useQuery } from "@tanstack/react-query";
import { useParams, useRouteLoaderData } from "react-router-dom";

import { PostContent } from "~/features/Post/PostContent";
import { Blog } from "~/models/blog";
import { publicPostQuery } from "~/services/queries";

export function Component() {
  const { blog } = useRouteLoaderData("public-portal") as { blog: Blog }; // see public-portal loader
  const { postId } = useParams();
  const query = useQuery(publicPostQuery(blog._id, postId!));

  if (!blog || !postId || !query.data) {
    return <></>;
  }

  return <PostContent blogId={blog._id} post={query.data} />;
}
