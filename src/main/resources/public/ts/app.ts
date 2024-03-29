import { Behaviours, model, ng, routes } from "entcore";
import { blogController } from "./controller";
import { blogPublicController } from "./controllers/publicBlog";
import { IdAndLibraryResourceInformation } from "entcore/types/src/ts/library/library.types";
import { LibraryServiceProvider } from "entcore/types/src/ts/library/library.service";
import { Blog } from "./models";
const URL = new URLSearchParams(location.search)
const HAS_VIEW = URL.has("view")
ng.configs.push(
  ng.config([
    "libraryServiceProvider",
    function (libraryServiceProvider: LibraryServiceProvider<Blog>) {
      libraryServiceProvider.setInvokableResourceInformationGetterFromResource(
        function () {
          return function (resource: Blog): IdAndLibraryResourceInformation {
            return {
                id: resource._id, 
                resourceInformation: {
                    title: resource.title, 
                    cover: resource.thumbnail,
                    application: "Blog",
                    pdfUri: `/blog/print/blog#/print/${resource._id}`
                }
            };
          };
        }
      );
    },
  ])
);

function redirectToReact() {
  if(!HAS_VIEW && window.location.pathname !== '/blog/print/blog' && !window.location.pathname.startsWith("/blog/pub")){
    window.location.replace("/blog?view=home")
  }
}

routes.define(function ($routeProvider) {
    $routeProvider
    //fixme don't work with direct access from front route
    .when("/view/:blogId", {
      action: "viewBlog",
    })
    .when("/edit/:blogId", {
      action: "editBlog",
    })
    .when("/new-article/:blogId", {
      action: "newArticle",
    })
    .when("/view/:blogId/:postId", {
      action: "viewPostModal",
    })
    .when("/detail/:blogId/:postId", {
      action: "viewPostInline",
    })
    .when("/print/:blogId", {
      action: "print",
    })
    .when("/print/:blogId/post/:postId", {
      action: "print",
    })
    .otherwise({
      action: HAS_VIEW && "list",
      redirectTo:!HAS_VIEW && redirectToReact,
    });
});

ng.controllers.push(blogController);
ng.controllers.push(blogPublicController);

console.log("Initializing model");

model.build = async function () {

    await Behaviours.load('blog');

    Behaviours.applicationsBehaviours.blog.model.register();

    (window as any).Blog = Behaviours.applicationsBehaviours.blog.model.Blog;
    (window as any).Post = Behaviours.applicationsBehaviours.blog.model.Post;
    (window as any).Comment = Behaviours.applicationsBehaviours.blog.model.Comment;
    (model as any).blogs = Behaviours.applicationsBehaviours.blog.model.app.blogs;

    (model as any).blogs.removeSelection = async function (): Promise<any> {
        for (let blog of this.selection()) {
            const index = this.all.indexOf(blog);
            this.all.splice(index, 1);
            await blog.remove();
        }
    }
};
