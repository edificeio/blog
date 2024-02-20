import { redirect } from "react-router-dom";

import { needRedirect } from "~/utils/redirectNGLocation";

/** Check old format URL and redirect if needed */
export const loader = async () => {
  const redirectPath = needRedirect();
  if (redirectPath) {
    redirect(redirectPath);
  }

  throw new Error("Not found");
};
