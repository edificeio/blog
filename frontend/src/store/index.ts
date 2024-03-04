import { create } from "zustand";

import { Post } from "~/models/post";

interface State {
  sidebarHighlightedPost: Post | undefined;
  postPageSize: number;
  actionBarPostId: string | undefined;
  updaters: {
    setSidebarHighlightedPost: (sidebarPostSelected?: Post) => void;
    setPostPageSize: (postPageSize: number) => void;
    setActionBarPostId: (actionBarPostId?: string) => void;
  };
}

export const useStoreContext = create<State>()((set, get) => ({
  sidebarHighlightedPost: undefined,
  postPageSize: 0,
  actionBarPostId: undefined,
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
  },
}));

export const useSidebarHighlightedPost = () =>
  useStoreContext((state) => state.sidebarHighlightedPost);

export const usePostPageSize = () =>
  useStoreContext((state) => state.postPageSize);

export const useActionBarPostId = () =>
  useStoreContext((state) => state.actionBarPostId);

/* Export updaters */
export const useStoreUpdaters = () =>
  useStoreContext((state) => state.updaters);
