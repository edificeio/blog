import { ID } from '@edifice.io/client';

export enum CommentState {
  PUBLISHED = 'PUBLISHED',
  SUBMITTED = 'SUBMITTED',
  DRAFT = 'DRAFT',
}

export type CommentDto = {
  id: ID;
  comment: string;
  created: {
    $date: string;
  };
  modified?: {
    $date: string;
  };
  author: {
    userId: ID;
    username: string;
    login: string;
  };
  state: CommentState;
  deleted?: boolean;
  replyTo?: ID;
};

export interface Comment {
  id: string;
  comment: string;
  authorId: string;
  authorName: string;
  createdAt: number;
  updatedAt?: number;
}
