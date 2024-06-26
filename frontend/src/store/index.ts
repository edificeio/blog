import { ViewsCounters } from "edifice-ts-client";
import { create } from "zustand";

import { Post } from "~/models/post";

interface State {
  sidebarHighlightedPost: Post | undefined;
  postPageSize: number;
  actionBarPostId: string | undefined;
  postsViewsCounters: ViewsCounters | undefined;
  updaters: {
    setSidebarHighlightedPost: (sidebarPostSelected?: Post) => void;
    setPostPageSize: (postPageSize: number) => void;
    setActionBarPostId: (actionBarPostId?: string) => void;
    addPostsViewsCounters: (postsViewsCounters: ViewsCounters) => void;
  };
}

export const useStoreContext = create<State>()((set, get) => ({
  sidebarHighlightedPost: undefined,
  postPageSize: 0,
  actionBarPostId: undefined,
  postsViewsCounters: undefined,
  updaters: {
    setSidebarHighlightedPost: (sidebarPostSelected) =>
      set({ sidebarHighlightedPost: sidebarPostSelected }),
    setPostPageSize: (postPageSize) => {
      if (get().postPageSize > postPageSize) {
        return;
      }
      set({ postPageSize });
    },
    setActionBarPostId: (actionBarPostId) => set({ actionBarPostId }),
    addPostsViewsCounters: (postsViewsCounters: ViewsCounters) =>
      set({
        postsViewsCounters: {
          ...get().postsViewsCounters,
          ...postsViewsCounters,
        },
      }),
  },
}));

export const useBlogState = () =>
  useStoreContext((state) => ({
    sidebarHighlightedPost: state.sidebarHighlightedPost,
    postPageSize: state.postPageSize,
    actionBarPostId: state.actionBarPostId,
    postsViewsCounters: state.postsViewsCounters,
  }));

/* Export updaters */
export const useStoreUpdaters = () =>
  useStoreContext((state) => state.updaters);
