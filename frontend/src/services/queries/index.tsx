import { useQuery } from "@tanstack/react-query";
import { ID, odeServices } from "edifice-ts-client";

//FIXME bouge ailleurs
type BlogModel = {
  _id: ID;
  title: string;
};

/**
 * useBlogId query
 * @returns blog data
 */
export const useBlogId = (id: ID) => {
  return useQuery({
    queryKey: ["blog", id],
    queryFn: async () => await odeServices.http().get<BlogModel>(`/blog/${id}`),
  });
};
