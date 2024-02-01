import { AppHeader, Breadcrumb } from "@edifice-ui/react";

import { useBlog } from "~/store";

const BlogHeader = () => {
  const blog = useBlog();
  return (
    <AppHeader>
      <Breadcrumb
        app={{
          address: "/blog",
          display: false,
          displayName: "Blog",
          icon: "",
          isExternal: false,
          name: "",
          scope: [],
        }}
        name={blog?.title}
      />
    </AppHeader>
  );
};

export default BlogHeader;
