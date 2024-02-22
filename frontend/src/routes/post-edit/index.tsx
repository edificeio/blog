import { useEffect } from "react";

import { QueryClient } from "@tanstack/react-query";
import { ACTION } from "edifice-ts-client";
import { useNavigate, useParams } from "react-router-dom";

import { createPostActions } from "~/config/createPostActions";
import { useActionDefinitions } from "~/features/ActionBar/useActionDefinitions";
import { CreatePost } from "~/features/Post/CreatePost";
import { availableActionsQuery } from "~/services/queries";

export const loader = (queryClient: QueryClient) => async () => {
  // Preload needed rights
  const actionsQuery = availableActionsQuery(createPostActions);
  await queryClient.fetchQuery(actionsQuery);
  return null;
};

export function Component() {
  const { blogId } = useParams();
  const navigate = useNavigate();
  // Check for the right to create a new post
  const { hasRight } = useActionDefinitions(createPostActions);

  useEffect(() => {
    // If the user cannot contrib, go back to the blog
    hasRight(ACTION.PUBLISH) || navigate(`../..`);
  }, [hasRight, navigate]);

  if (!blogId) {
    return <></>;
  }

  return <CreatePost blogId={blogId} />;
}
