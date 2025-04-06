
// Update the Comment interface to include display_user_id as a string
export interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  display_user_id: string; // Changed from optional to required
}
