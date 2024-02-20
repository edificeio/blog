import { Layout } from "@edifice-ui/react";
import { Outlet, redirect } from "react-router-dom";

import { needRedirect } from "~/utils/redirectNGLocation";

/** Check old format URL and redirect if needed */
export const rootLoader = () => async () => {
  const redirectPath = needRedirect();
  if (redirectPath) {
    redirect(redirectPath);
  }

  return;
};

export const Root = () => {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};
