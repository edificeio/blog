/*
import { useQuery } from "@tanstack/react-query";
import { odeServices } from "edifice-ts-client";
//FIXME bouge ailleurs
type BlogModel = {
  _id: string;
  title: string;
};
*/
/**
 * useBlogId query
 * @returns blog data
 */
/*
export const useBlogId = (id: string) => {
  return useQuery<string, Error, BlogModel,[string,string]>(
    {
      queryKey: ["blog",id],
      queryFn: () =>
        odeServices.http().get<BlogModel>(`/blog/${id}`),
    },
    { _id: "toc", title: "tic" },
  );
};
*/
