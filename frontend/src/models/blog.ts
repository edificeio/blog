import { ID } from "edifice-ts-client";

export type CommentType = "NONE" | "IMMEDIATE" | "RESTRAINT";
export type PublishType = "IMMEDIATE" | "RESTRAINT";

export type Blog = {
  _id: ID;
  title: string;
  description: string;
  author: {
    userId: ID;
    username: string;
    login: string;
  };
  thumbnail: string;
  shared: [];
  "publish-type": PublishType;
  "comment-type": CommentType;
  visibility: "OWNER" | "PUBLIC";
  slug: string;
  version: number;
  created: {
    $date: string;
  };
  modified: {
    $date: string;
  };
};
