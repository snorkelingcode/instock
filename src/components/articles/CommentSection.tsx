import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserIcon, MessageSquare, Clock, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import LoadingSpinner from "@/components/ui/loading-spinner";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user_email: string;
}

interface CommentSectionProps {
  articleId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ articleId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingComment, setIsDeletingComment] = useState<string | null>(null);
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchComments();
  }, [articleId]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      // First fetch the comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('article_comments')
        .select(`
          id,
          content,
          created_at,
          user_id
        `)
        .eq("article_id", articleId)
        .order("created_at", { ascending: false });

      if (commentsError) throw commentsError;

      // If we have comments, fetch user emails separately
      if (commentsData && commentsData.length > 0) {
        // Since we can't directly query auth.users, we'll use the session user for the current user
        // and use placeholders for other users
        
        const formattedComments = commentsData.map(comment => {
          // For the current user, use their email from the session
          const isCurrentUser = user && comment.user_id === user.id;
          
          // Get email or extract username from email for display
          let userEmail;
          if (isCurrentUser && user.email) {
            userEmail = user.email;
          } else {
            // Create a username from the user ID instead of showing the full ID
            userEmail = `user${comment.user_id.substring(0, 4)}`;
          }
          
          return {
            id: comment.id,
            content: comment.content,
            created_at: comment.created_at,
            user_id: comment.user_id,
            user_email: userEmail || "Anonymous User"
          };
        });
        
        setComments(formattedComments);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast({
        title: "Error",
        description: "Failed to load comments. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to post a comment.",
        variant: "destructive",
      });
      return;
    }
    
    if (!newComment.trim()) {
      toast({
        title: "Empty comment",
        description: "Please enter a comment before submitting.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('article_comments')
        .insert({
          article_id: articleId,
          user_id: user.id,
          content: newComment.trim()
        });
        
      if (error) throw error;
      
      toast({
        title: "Comment posted",
        description: "Your comment has been published successfully.",
      });
      
      setNewComment("");
      fetchComments();
      
    } catch (error) {
      console.error("Error posting comment:", error);
      toast({
        title: "Error",
        description: "Failed to post your comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string, commentUserId: string) => {
    // Only proceed if the user is logged in AND (is the comment author OR is an admin)
    if (!user || (!isAdmin && user.id !== commentUserId)) {
      toast({
        title: "Permission denied",
        description: "You do not have permission to delete this comment.",
        variant: "destructive",
      });
      return;
    }

    setIsDeletingComment(commentId);
    
    try {
      const { error } = await supabase
        .from('article_comments')
        .delete()
        .eq('id', commentId);
      
      if (error) throw error;
      
      // Remove the deleted comment from state
      setComments(comments.filter(comment => comment.id !== commentId));
      
      toast({
        title: "Comment deleted",
        description: "The comment has been successfully deleted.",
      });
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast({
        title: "Error",
        description: "Failed to delete the comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingComment(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };
  
  const getUserInitials = (identifier: string) => {
    // If it looks like an email, get the first two characters of the first part
    if (identifier.includes('@')) {
      return identifier.split('@')[0].substring(0, 2).toUpperCase();
    }
    // Otherwise just take the first two chars of the identifier
    return identifier.substring(0, 2).toUpperCase();
  };
  
  const getDisplayName = (identifier: string) => {
    // If it's an email, extract the username part
    if (identifier.includes('@')) {
      return identifier.split('@')[0];
    }
    return identifier;
  };

  const canDeleteComment = (commentUserId: string) => {
    return user && (isAdmin || user.id === commentUserId);
  };

  return (
    <div className="mt-4">
      <h2 className="text-xl font-bold mb-6 flex items-center">
        <MessageSquare className="mr-2 h-5 w-5" />
        Comments
      </h2>
      
      {user ? (
        <form onSubmit={handleSubmitComment} className="mb-8">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts on this article..."
            className="min-h-[100px] mb-3"
          />
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="ml-auto block"
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Posting...
              </>
            ) : "Post Comment"}
          </Button>
        </form>
      ) : (
        <Card className="p-4 mb-8 text-center bg-gray-50">
          <p className="mb-3">Sign in to join the conversation and post comments</p>
          <Button onClick={() => window.location.href = "/auth"}>
            Sign In / Create Account
          </Button>
        </Card>
      )}
      
      {isLoading ? (
        <div className="flex justify-center py-10">
          <LoadingSpinner />
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="border-b border-gray-200 pb-5">
              <div className="flex items-start gap-3 mb-2">
                <Avatar className="h-8 w-8 bg-red-100">
                  <AvatarFallback className="bg-red-100 text-red-600">
                    {getUserInitials(comment.user_email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{getDisplayName(comment.user_email)}</p>
                      {user && user.id === comment.user_id && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">You</span>
                      )}
                      {isAdmin && user && user.id === comment.user_id && (
                        <div className="flex items-center" aria-label="Admin">
                          <Shield className="h-4 w-4 text-red-500" />
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 flex items-center mt-1 sm:mt-0">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <p className="mt-2 text-gray-700">{comment.content}</p>
                  
                  {canDeleteComment(comment.user_id) && (
                    <div className="mt-2 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteComment(comment.id, comment.user_id)}
                        disabled={isDeletingComment === comment.id}
                      >
                        {isDeletingComment === comment.id ? (
                          <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Deleting...
                          </>
                        ) : "Delete"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border-t border-b border-gray-200">
          <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-2" />
          <h3 className="text-lg font-medium">No comments yet</h3>
          <p className="text-gray-500">Be the first to share your thoughts on this article!</p>
        </div>
      )}
    </div>
  );
};

export default CommentSection;
