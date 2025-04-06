
export interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  display_name: string;  // Changed from display_user_id to be more descriptive
}
