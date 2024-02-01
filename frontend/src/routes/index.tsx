import { QueryClient } from "@tanstack/react-query";
import { LoaderFunctionArgs, createBrowserRouter } from "react-router-dom";

import Root from "~/app/Root";

const queryClient = new QueryClient();

const routes = [
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
        path: "view/:blogId",
        async lazy() {
          const { BlogView, blogViewLoader } = await import("~/app/BlogView");
          return {
            loader: (params: LoaderFunctionArgs<{ blogId: string }>) =>
              blogViewLoader(params, queryClient),
            Component: BlogView,
          };
        },
      },
      // Post is the page containing a spécific post from a blog
      {
        path: "/view/:blogId/post/:postId",
        async lazy() {
          const { PostView } = await import("~/app/PostView");
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
      const { default: Component, loader } = await import("../app/OldFormat");
      return {
        loader,
        Component,
      };
    },
    //FIXME errorElement: <ErrorPage />,
  },
];

export const router = createBrowserRouter(routes, {
  basename: import.meta.env.PROD ? "/blog" : "/",
});
