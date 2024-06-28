import { useCallback, useEffect, useState } from "react";

import { ViewsCounter, ViewsModal } from "@edifice-ui/react";
import { ViewsDetails } from "edifice-ts-client";

import { Post } from "~/models/post";
import { loadPostsViewsDetails } from "~/services/api";

export interface PostAudienceProps {
  blogId: string;
  post: Post;
  withViews: boolean;
}

export const PostAudience = ({
  /*blogId,*/
  post,
  withViews,
}: PostAudienceProps) => {
  // Variables for read mode
  const [viewsDetails, setViewsDetails] = useState<ViewsDetails | undefined>();
  const [isViewsModalOpen, setIsViewsModalOpen] = useState(false);

  const loadViews = useCallback(async () => {
    const details = await loadPostsViewsDetails(post._id);
    setViewsDetails(details);
  }, [post._id, setViewsDetails]);

  useEffect(() => {
    withViews && loadViews();
  }, [withViews, loadViews]);

  const handleViewsOnClick = () => {
    if (viewsDetails && viewsDetails.uniqueViewsCounter > 0)
      setIsViewsModalOpen(true);
  };

  const handleViewsModalClose = () => {
    setIsViewsModalOpen(false);
  };

  return (
    <div className="d-flex justify-content-between mt-32">
      <div className="d-flex gap-12 small text-gray-700 align-items-center ">
        <span className="separator d-none d-md-block"></span>
        {withViews && typeof viewsDetails === "object" && (
          <>
            <ViewsCounter
              viewsCounter={viewsDetails.uniqueViewsCounter}
              onClick={handleViewsOnClick}
            />
            {isViewsModalOpen && (
              <ViewsModal
                viewsDetails={viewsDetails}
                isOpen={isViewsModalOpen}
                onModalClose={handleViewsModalClose}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};
