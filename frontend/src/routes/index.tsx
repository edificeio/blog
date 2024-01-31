import { createBrowserRouter } from "react-router-dom";

import Root from "~/app/Root";

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
        path: "view/:blodId",
        async lazy() {
          const { BlogView } = await import("~/app/BlogView");
          return {
            Component: BlogView,
          };
        },
      },
      // Post is the page containing a spécific post from a blog
      {
        path: "/view/:blodId/post/:postId",
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
