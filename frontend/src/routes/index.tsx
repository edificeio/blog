import { QueryClient } from "@tanstack/react-query";
import { createBrowserRouter } from "react-router-dom";

import Root from "~/routes/root";

const routes = (queryClient: QueryClient) => [
  {
    path: "/",
    element: <Root />,
    children: [
      /*FIXME
      {
        index: true,
        element: <Explorer />,
        //FIXME errorElement: <ErrorPage />,
      },
      */
      // TODO list et view
      // View is the page containing the blog view with all information about the blog and a list of posts
      {
        path: "id/:blogId",
        async lazy() {
          const { Blog, blogLoader } = await import("~/routes/blog");
          return {
            loader: blogLoader(queryClient),
            Component: Blog,
          };
        },
      },
      // Post is the page containing a spécific post from a blog
      {
        path: "/id/:blogId/post/:postId",
        async lazy() {
          const { PostView } = await import("~/routes/post");
          return {
            Component: PostView,
          };
        },
      },
    ],
  },
  {
    path: "/oldformat/:blogId/:postId",
    async lazy() {
      const { default: Component, loader } = await import("./old-format");
      return {
        loader,
        Component,
      };
    },
    //FIXME errorElement: <ErrorPage />,
  },
];

export const router = (queryClient: QueryClient) =>
  createBrowserRouter(routes(queryClient), {
    basename: import.meta.env.PROD ? "/blog" : "/",
  });
