import { useEffect } from "react";

import { useOdeTheme } from "@edifice-ui/react";
import { ActionFunctionArgs, useLoaderData } from "react-router-dom";

//FIXME déplacer dans hooks ou features, à voir
export async function loader({ request, params }: ActionFunctionArgs) {
  const url = new URL(request.url);
  const fileId = url.searchParams.get("fileId");
  const docId = url.searchParams.get("docId");

  const response = fileId
    ? await fetch(`/pocediteur/files/${fileId}`)
    : await fetch(`/pocediteur/${params.source}/docs/${docId}`);

  const responseJson = fileId ? await response.text() : await response.json();

  const data = fileId ? responseJson : responseJson.content;

  if (!response) {
    throw new Response("", {
      status: 404,
      statusText: "Not Found",
    });
  }

  return data;
}

export default () => {
  const data = useLoaderData() as string;
  const { theme } = useOdeTheme();

  useEffect(() => {
    const link = document.getElementById("theme") as HTMLAnchorElement;
    link.href = `${theme?.themeUrl}theme.css`;
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
      dangerouslySetInnerHTML={{ __html: data }}
    />
  );
};
