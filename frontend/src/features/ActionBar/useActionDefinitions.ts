import { useCallback } from "react";

import { useUser } from "@edifice-ui/react";
import { useQuery } from "@tanstack/react-query";
import { ACTION, ActionType, IAction, ID, RightRole } from "edifice-ts-client";

import { Post } from "~/models/post";
import { availableActionsQuery, blogRightsQuery } from "~/services/queries";
import { IActionDefinition } from "~/utils/types";

/**
 * This hook resolves instances of IActionDefinition into IAction.s,
 * => check user's workflow and resource rights, and apply them on each IActionDefinition
 */
export const useActionDefinitions = (
  actionDefinitions: IActionDefinition[],
  blogId: ID,
) => {
  // Check workflow rights.
  const { data: availableActions } = useQuery<
    Record<string, boolean>,
    Error,
    IAction[]
  >(availableActionsQuery(actionDefinitions));

  // Check resource rights.
  const { user } = useUser();
  const { data: rights } = useQuery(blogRightsQuery(blogId, user!));

  /**
   * Check the `right` field of an IAction.
   * @returns `true` if no right is required, or if the current user has a sufficient role.
   * Roles order is `creator` > `manager` > `contrib` > `read`
   */
  const hasRight = useCallback(
    (action: IAction) => {
      const rolesPrecedence = [
        "creator",
        "manager",
        "contrib",
        "read",
      ] as RightRole[];

      if (typeof action?.right === "string" && !!rights) {
        for (let i = 0; i < rolesPrecedence.length; i++) {
          const rightRole = rolesPrecedence[i];
          if (rights[rightRole] === true) {
            // The user has a powerful enough right to use this action.
            return true;
          }
          if (rightRole === action.right) break;
        }
        return false;
      }
      return true;
    },
    [rights],
  );

  /** Filter function the actions the current user can use on a post. */
  const filterActionsForPost = useCallback(
    (post: Post) => {
      const isPostAuthor = post.author.userId === user?.userId;
      const authorized = [ACTION.PRINT] as ActionType[];

      // Managers have all rights
      if (rights?.creator || rights?.manager) {
        authorized.push(ACTION.OPEN, ACTION.DELETE, ACTION.PUBLISH);
        if (post.state === "PUBLISHED") authorized.push(ACTION.MOVE);
      }
      // Contributors have limited actions rights on their own posts
      else if (rights?.contrib && isPostAuthor) {
        authorized.push(ACTION.OPEN, ACTION.DELETE, ACTION.PUBLISH);
      }

      return (action: IAction) => authorized.indexOf(action.id) >= 0;
    },
    [rights?.contrib, rights?.creator, rights?.manager, user?.userId],
  );

  /** Get the actions the current user can use on a post. */
  const availableActionsForPost = useCallback(
    (post: Post) => availableActions?.filter(filterActionsForPost(post)),
    [availableActions, filterActionsForPost],
  );

  return {
    availableActions,
    ...rights,
    hasRight,
    availableActionsForPost,
  };
};
