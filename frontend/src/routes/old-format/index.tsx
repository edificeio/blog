import { useEffect } from "react";

import { useOdeTheme } from "@edifice-ui/react";
import { useTranslation } from "react-i18next";
import { useLoaderData } from "react-router-dom";

import { Post } from "~/models/post";

export { loader } from "../post";

export const Component = () => {
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
