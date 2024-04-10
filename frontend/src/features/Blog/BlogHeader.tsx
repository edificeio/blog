import { AppHeader, Breadcrumb } from "@edifice-ui/react";

import { BlogActionBar } from "./BlogActionBar";
import { Blog } from "~/models/blog";
import { basename } from "~/routes";

export interface BlogProps {
  blog: Blog;
  readonly?: boolean;
}

export const BlogHeader = ({ blog, readonly = false }: BlogProps) => {
  return (
    <AppHeader>
      <div className="d-flex flex-column flex-md-row flex-nowrap justify-content-md-between flex-fill gap-12 overflow-hidden">
        <div className="overflow-hidden">
          <Breadcrumb
            app={{
              address: basename,
              display: false,
              displayName: "Blog",
              icon: "",
              isExternal: false,
              name: "",
              scope: [],
            }}
            name={blog.title}
          />
        </div>
        {!readonly && <BlogActionBar blog={blog} />}
      </div>
    </AppHeader>
  );
};
