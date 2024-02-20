import { Layout } from "@edifice-ui/react";
import { Outlet } from "react-router-dom";

function Root() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

export default Root;
