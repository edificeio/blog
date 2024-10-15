import { matchPath } from 'react-router-dom';

import { basename } from '~/routes';

/* Check location and redirect to the new URL if needed
 * @returns null
 */
export function redirectBlogHashLocation(): Response | null {
  const hashLocation = location.hash.substring(1);

  // Check if the URL is an old format (angular root with hash) and redirect to the new format
  if (hashLocation) {
    const isBlogPath = matchPath('/view/:blogId', hashLocation);
    if (isBlogPath) {
      // Redirect to the new format
      const redirectPath = `/id/${isBlogPath?.params.blogId}`;
      location.replace(
        location.origin + basename.replace(/\/$/g, '') + redirectPath,
      );
    }
    const isViewPostPath = matchPath('/view/:blogId/:postId', hashLocation);
    if (isViewPostPath) {
      // Redirect to the new format
      const redirectPath = `/id/${isViewPostPath?.params.blogId}/post/${isViewPostPath?.params.postId}`;
      location.replace(
        location.origin + basename.replace(/\/$/g, '') + redirectPath,
      );
    }

    const isPostPath = matchPath('/detail/:blogId/:postId', hashLocation);
    if (isPostPath) {
      // Redirect to the new format
      const redirectPath = `/id/${isPostPath?.params.blogId}/post/${isPostPath?.params.postId}`;
      location.replace(
        location.origin + basename.replace(/\/$/g, '') + redirectPath,
      );
    }
  }

  return null;
}
