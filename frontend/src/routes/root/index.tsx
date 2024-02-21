import { Layout } from "@edifice-ui/react";
import { Outlet, redirect } from "react-router-dom";

import { needRedirect } from "~/utils/redirectBlogHashLocation";

/** Check old format URL and redirect if needed */
export const rootLoader = () => async () => {
  const redirectPath = needRedirect();
  if (redirectPath) {
    location.href = location.origin + redirectPath;
    return redirect(redirectPath);
  }

  return null;
};

export const Root = () => {
  console.log("root");
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};
