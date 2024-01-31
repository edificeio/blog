import { create } from "zustand";

import { Blog } from "~/store/models/blog";

/* SAMPLE STORE */

interface State {
  blog: Blog | null;
  updaters: {
    setBlog: (blog?: Blog) => void;
  };
}

export const useStoreContext = create<State>()((set) => ({
  blog: null,
  updaters: {
    setBlog: (blog) => set({ blog }),
  },
}));

export const useBlog = () => useStoreContext((state) => state.blog);

/* Export updaters */
export const useStoreUpdaters = () =>
  useStoreContext((state) => state.updaters);
