import { useEffect } from "react";

import { useOdeTheme } from "@edifice-ui/react";
import { ERROR_CODE, odeServices } from "edifice-ts-client";
import { useTranslation } from "react-i18next";
import { LoaderFunctionArgs, useLoaderData } from "react-router-dom";

import { Post } from "~/models/post";
import { notifyError } from "~/utils/BlogEvent";

/** Load a blog post content */
export async function loader({ params }: LoaderFunctionArgs) {
  const { blogId, postId } = params;
  const http = odeServices.http();
  const loaded = await http.get<Post>(
    `/blog/post/${blogId}/${postId}?state=PUBLISHED`,
  );
  if (http.isResponseError()) {
    notifyError({
      code: ERROR_CODE.TRANSPORT_ERROR,
      text: http.latestResponse.statusText,
    });
    return null;
  }
  return loaded;
}

export default () => {
  const post = useLoaderData() as Post | null;
  const { theme } = useOdeTheme();
  const { t } = useTranslation();

  useEffect(() => {
    const link = document.getElementById("theme") as HTMLAnchorElement;
    if (link) link.href = `${theme?.themeUrl}theme.css`;
  }, [theme?.themeUrl]);

  const style = {
    margin: "auto",
    padding: "16px",
    minHeight: "100vh",
    backgroundColor: "#fff",
  };

  return (
    <div
      style={style}
      contentEditable={false}
      dangerouslySetInnerHTML={{
        __html:
          post?.content ??
          t("<p>I am sorry Dave, I am afraid I cannot do that.</p>"),
      }}
    />
  );
};
