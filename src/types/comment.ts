
export interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  display_name: string;
  likes_count?: number;
  replies_count?: number;
  liked_by_me?: boolean;
}

export interface CommentReply {
  id: string;
  parent_comment_id: string;
  content: string;
  created_at: string;
  user_id: string;
  display_name: string;
}

export interface CommentReport {
  id: string;
  comment_id: string;
  reporter_id: string;
  reporter_name: string;
  reason: string;
  status: string;
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
  resolver_name?: string;
  resolution_notes?: string;
  comment_content: string;
  article_id: string;
  article_title: string;
}
