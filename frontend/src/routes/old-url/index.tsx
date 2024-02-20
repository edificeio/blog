import { matchPath, redirect } from "react-router-dom";

/** Check old format URL and redirect if needed */
export const loader = async () => {
  const ngLocation = location.hash.substring(1);

  if (ngLocation) {
    const blog = matchPath("/view/:blogId", ngLocation);
    const post = matchPath("/detail/:blogId/:postId", ngLocation);

    if (blog) {
      return redirect(`/id/${blog?.params.blogId}`);
    }
    if (post) {
      return redirect(`/id/${post?.params.blogId}/post/${post?.params.postId}`);
    }
  }

  // TODO add 404 page or redirect to home
  throw new Error("Not found");
};
