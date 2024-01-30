import { createBrowserRouter } from "react-router-dom";

import OldFormat, { loader } from "~/app/OldFormat";
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
    ],
  },
  {
    path: "/oldformat/:source",
    element: <OldFormat />,
    loader,
    //FIXME errorElement: <ErrorPage />,
  },
];

export const router = createBrowserRouter(routes, {
  basename: import.meta.env.PROD ? "/blog" : "/",
});
