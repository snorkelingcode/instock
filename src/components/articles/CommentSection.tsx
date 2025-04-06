
import React, { useState, useEffect, useRef } from "react";
import { Comment, CommentReply } from "@/types/comment";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  UserIcon, 
  MessageSquare, 
  Clock, 
  Shield, 
  Heart, 
  Flag, 
  Reply, 
  X,
  AlertCircle,
  HeartOff 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import LoadingSpinner from "@/components/ui/loading-spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CommentSectionProps {
  articleId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ articleId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingComment, setIsDeletingComment] = useState<string | null>(null);
  const { user, isAdmin, session } = useAuth();
  const { toast } = useToast();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [openReplies, setOpenReplies] = useState<Record<string, boolean>>({});
  const [commentReplies, setCommentReplies] = useState<Record<string, CommentReply[]>>({});
  const [loadingReplies, setLoadingReplies] = useState<Record<string, boolean>>({});
  const [reportReason, setReportReason] = useState("");
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchComments();
  }, [articleId, user?.id, session?.access_token]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      // Fetch comments directly instead of using the RPC function
      const { data, error } = await supabase
        .from('article_comments')
        .select(`
          id,
          content,
          created_at,
          user_id
        `)
        .eq('article_id', articleId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching comments:", error);
        throw error;
      }

      console.log("Fetched comments:", data);
      
      if (!data || data.length === 0) {
        setComments([]);
        setIsLoading(false);
        return;
      }
      
      // Get user display names
      const userIds = [...new Set(data.map(comment => comment.user_id))];
      
      const { data: displayNames, error: namesError } = await supabase
        .rpc('get_user_display_names', {
          user_ids: userIds
        });
      
      if (namesError) {
        console.error("Error fetching display names:", namesError);
      }
      
      // Create a map of user IDs to display names
      const displayNameMap: Record<string, string> = {};
      if (displayNames) {
        displayNames.forEach((item: any) => {
          if (item && item.id && item.display_user_id) {
            displayNameMap[item.id] = item.display_user_id;
          }
        });
      }
      
      // Count likes for each comment
      const likesCountsPromises = data.map(async (comment) => {
        const { count, error } = await supabase
          .from('comment_likes')
          .select('*', { count: 'exact', head: true })
          .eq('comment_id', comment.id);
        
        return { commentId: comment.id, count: count || 0, error };
      });
      
      const likesCounts = await Promise.all(likesCountsPromises);
      
      // Count replies for each comment
      const repliesCountsPromises = data.map(async (comment) => {
        const { count, error } = await supabase
          .from('comment_replies')
          .select('*', { count: 'exact', head: true })
          .eq('parent_comment_id', comment.id);
        
        return { commentId: comment.id, count: count || 0, error };
      });
      
      const repliesCounts = await Promise.all(repliesCountsPromises);
      
      // Check which comments the current user has liked
      let userLikes: Record<string, boolean> = {};
      
      if (user) {
        const { data: likesData, error: likesError } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .eq('user_id', user.id);
          
        if (likesError) {
          console.error("Error fetching likes:", likesError);
        } else if (likesData) {
          userLikes = likesData.reduce((acc, curr) => {
            acc[curr.comment_id] = true;
            return acc;
          }, {} as Record<string, boolean>);
        }
      }
      
      // Build the complete comments object with all required fields
      const commentsWithDetails = data.map(comment => {
        const likes = likesCounts.find(l => l.commentId === comment.id)?.count || 0;
        const replies = repliesCounts.find(r => r.commentId === comment.id)?.count || 0;
        
        return {
          ...comment,
          display_name: displayNameMap[comment.user_id] || `user_${comment.user_id.substring(0, 8)}`,
          likes_count: likes,
          replies_count: replies,
          liked_by_me: !!userLikes[comment.id]
        };
      });
      
      setComments(commentsWithDetails);
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
      fetchComments(); // Refresh comments after posting
      
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

  const handleLikeComment = async (commentId: string, isCurrentlyLiked: boolean) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like comments.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Optimistically update UI
      setComments(comments.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            liked_by_me: !isCurrentlyLiked,
            likes_count: isCurrentlyLiked 
              ? Math.max(0, (comment.likes_count || 0) - 1)
              : (comment.likes_count || 0) + 1
          };
        }
        return comment;
      }));

      if (isCurrentlyLiked) {
        // Delete the like
        const { error } = await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Add a like
        const { error } = await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            user_id: user.id
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      
      // Revert optimistic update on failure
      fetchComments();
      
      toast({
        title: "Error",
        description: "Failed to update like status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleReplies = async (commentId: string) => {
    // Toggle the open state
    setOpenReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
    
    // If opening replies and they're not loaded yet, fetch them
    if (!openReplies[commentId] && !commentReplies[commentId]) {
      await fetchReplies(commentId);
    }
  };

  const fetchReplies = async (commentId: string) => {
    setLoadingReplies(prev => ({ ...prev, [commentId]: true }));
    
    try {
      // Fetch replies for this comment manually since we're avoiding the table type errors
      const { data, error } = await supabase
        .from('comment_replies')
        .select(`
          id,
          parent_comment_id,
          content,
          created_at,
          user_id
        `)
        .eq('parent_comment_id', commentId)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Get unique user IDs
        const userIds = [...new Set(data.map(reply => reply.user_id))];
        
        // Fetch display names for these users
        const { data: displayNames, error: namesError } = await supabase
          .rpc('get_user_display_names', { 
            user_ids: userIds 
          });
          
        if (namesError) throw namesError;
        
        // Create display name map
        const displayNameMap: Record<string, string> = {};
        if (displayNames) {
          displayNames.forEach((item: any) => {
            if (item && item.id && item.display_user_id) {
              displayNameMap[item.id] = item.display_user_id;
            }
          });
        }
        
        // Add display names to replies
        const repliesWithNames = data.map(reply => ({
          ...reply,
          display_name: displayNameMap[reply.user_id] || `user_${reply.user_id.substring(0, 8)}`
        }));
        
        // Update state
        setCommentReplies(prev => ({
          ...prev,
          [commentId]: repliesWithNames
        }));
      } else {
        // No replies, set empty array
        setCommentReplies(prev => ({
          ...prev,
          [commentId]: []
        }));
      }
    } catch (error) {
      console.error("Error fetching replies:", error);
      toast({
        title: "Error",
        description: "Failed to load replies. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingReplies(prev => ({ ...prev, [commentId]: false }));
    }
  };

  const handleStartReply = (commentId: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to reply to comments.",
        variant: "destructive",
      });
      return;
    }
    
    setReplyingTo(commentId);
    setReplyContent("");
    
    // Make sure the comment's replies are open
    if (!openReplies[commentId]) {
      toggleReplies(commentId);
    }
    
    // Focus the reply input after rendering
    setTimeout(() => {
      if (replyInputRef.current) {
        replyInputRef.current.focus();
      }
    }, 100);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyContent("");
  };

  const handleSubmitReply = async (parentCommentId: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to reply to comments.",
        variant: "destructive",
      });
      return;
    }
    
    if (!replyContent.trim()) {
      toast({
        title: "Empty reply",
        description: "Please enter a reply before submitting.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmittingReply(true);
    
    try {
      const { data, error } = await supabase
        .from('comment_replies')
        .insert({
          parent_comment_id: parentCommentId,
          user_id: user.id,
          content: replyContent.trim()
        })
        .select();
        
      if (error) throw error;
      
      // Get the display name for the user
      const { data: displayNameData, error: displayNameError } = await supabase
        .rpc('get_user_display_name', { user_id_param: user.id });
      
      if (displayNameError) {
        console.error("Error getting display name:", displayNameError);
      }
      
      const displayName = displayNameData || `user_${user.id.substring(0, 8)}`;
      
      // Optimistically update UI with new reply
      if (data && data[0]) {
        const newReply = {
          ...data[0],
          display_name: displayName
        };
        
        setCommentReplies(prev => ({
          ...prev,
          [parentCommentId]: [...(prev[parentCommentId] || []), newReply]
        }));
      }
      
      // Update the reply count on the parent comment
      setComments(comments.map(comment => {
        if (comment.id === parentCommentId) {
          return {
            ...comment,
            replies_count: (comment.replies_count || 0) + 1
          };
        }
        return comment;
      }));
      
      toast({
        title: "Reply posted",
        description: "Your reply has been published successfully.",
      });
      
      setReplyingTo(null);
      setReplyContent("");
      
    } catch (error) {
      console.error("Error posting reply:", error);
      toast({
        title: "Error",
        description: "Failed to post your reply. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleOpenReportDialog = (commentId: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to report comments.",
        variant: "destructive",
      });
      return;
    }
    
    setReportingCommentId(commentId);
    setReportReason("");
    setReportDialogOpen(true);
  };

  const handleSubmitReport = async () => {
    if (!user || !reportingCommentId) return;
    
    if (!reportReason) {
      toast({
        title: "Reason required",
        description: "Please select a reason for reporting this comment.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmittingReport(true);
    
    try {
      const { error } = await supabase
        .from('comment_reports')
        .insert({
          comment_id: reportingCommentId,
          reporter_id: user.id,
          reason: reportReason
        });
        
      if (error) throw error;
      
      toast({
        title: "Report submitted",
        description: "Thank you for your report. Our moderators will review it soon.",
      });
      
      setReportDialogOpen(false);
      setReportingCommentId(null);
      setReportReason("");
      
    } catch (error) {
      console.error("Error submitting report:", error);
      toast({
        title: "Error",
        description: "Failed to submit your report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingReport(false);
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
  
  const getUserInitials = (displayName: string) => {
    // Take first two characters of the display name
    return displayName.substring(0, 2).toUpperCase();
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
                    {getUserInitials(comment.display_name || 'User')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{comment.display_name}</p>
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
                  
                  <div className="mt-3 flex items-center space-x-4 text-gray-500 text-sm">
                    <button 
                      onClick={() => user && handleLikeComment(comment.id, !!comment.liked_by_me)}
                      className={`flex items-center hover:text-red-600 ${comment.liked_by_me ? 'text-red-600' : ''}`}
                      disabled={!user}
                    >
                      {comment.liked_by_me ? (
                        <Heart className="h-4 w-4 fill-red-600 text-red-600 mr-1" />
                      ) : (
                        <Heart className="h-4 w-4 mr-1" />
                      )}
                      {comment.likes_count || 0}
                    </button>
                    
                    <button 
                      onClick={() => handleStartReply(comment.id)}
                      className="flex items-center hover:text-blue-600"
                      disabled={!user}
                    >
                      <Reply className="h-4 w-4 mr-1" />
                      Reply
                    </button>
                    
                    <button 
                      onClick={() => handleOpenReportDialog(comment.id)}
                      className="flex items-center hover:text-orange-600"
                      disabled={!user || user.id === comment.user_id}
                      title={user && user.id === comment.user_id ? "Cannot report your own comment" : "Report comment"}
                    >
                      <Flag className="h-4 w-4 mr-1" />
                      Report
                    </button>
                    
                    {canDeleteComment(comment.user_id) && (
                      <button 
                        onClick={() => handleDeleteComment(comment.id, comment.user_id)}
                        className="flex items-center text-red-600 hover:text-red-700"
                        disabled={isDeletingComment === comment.id}
                      >
                        {isDeletingComment === comment.id ? (
                          <LoadingSpinner size="sm" className="mr-1" />
                        ) : (
                          <X className="h-4 w-4 mr-1" />
                        )}
                        Delete
                      </button>
                    )}
                  </div>
                  
                  {/* Show reply count and toggle button if there are replies */}
                  {(comment.replies_count && comment.replies_count > 0) || openReplies[comment.id] ? (
                    <button 
                      onClick={() => toggleReplies(comment.id)}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      {openReplies[comment.id] ? 'Hide replies' : `Show ${comment.replies_count} ${comment.replies_count === 1 ? 'reply' : 'replies'}`}
                    </button>
                  ) : null}
                  
                  {/* Replies section */}
                  {openReplies[comment.id] && (
                    <div className="mt-3 ml-6 border-l-2 border-gray-100 pl-4">
                      {loadingReplies[comment.id] ? (
                        <div className="py-3 flex justify-center">
                          <LoadingSpinner size="sm" />
                        </div>
                      ) : commentReplies[comment.id]?.length > 0 ? (
                        <div className="space-y-4">
                          {commentReplies[comment.id].map(reply => (
                            <div key={reply.id} className="pt-2">
                              <div className="flex items-start gap-2">
                                <Avatar className="h-6 w-6 bg-blue-100">
                                  <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                                    {getUserInitials(reply.display_name || 'User')}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-sm">{reply.display_name}</p>
                                    {user && user.id === reply.user_id && (
                                      <span className="text-xs bg-gray-100 text-gray-600 px-1 py-0.5 rounded">You</span>
                                    )}
                                    <span className="text-xs text-gray-500">
                                      {formatDate(reply.created_at)}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-700 mt-1">{reply.content}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 py-2">No replies yet</p>
                      )}
                      
                      {/* Reply input */}
                      {replyingTo === comment.id && user && (
                        <div className="mt-3">
                          <Textarea
                            ref={replyInputRef}
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Write a reply..."
                            className="min-h-[80px] mb-2 text-sm"
                          />
                          <div className="flex justify-end gap-2">
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm"
                              onClick={handleCancelReply}
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="button" 
                              size="sm"
                              onClick={() => handleSubmitReply(comment.id)}
                              disabled={isSubmittingReply || !replyContent.trim()}
                            >
                              {isSubmittingReply ? (
                                <>
                                  <LoadingSpinner size="sm" className="mr-1" />
                                  Posting...
                                </>
                              ) : "Post Reply"}
                            </Button>
                          </div>
                        </div>
                      )}
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
      
      {/* Report dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Comment</DialogTitle>
            <DialogDescription>
              Please tell us why you're reporting this comment.
              Our moderators will review the comment based on our community guidelines.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Select value={reportReason} onValueChange={setReportReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spam">Spam or advertising</SelectItem>
                <SelectItem value="harassment">Harassment or bullying</SelectItem>
                <SelectItem value="inappropriate">Inappropriate content</SelectItem>
                <SelectItem value="misinformation">Misinformation</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              onClick={handleSubmitReport}
              disabled={isSubmittingReport || !reportReason}
            >
              {isSubmittingReport ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Submitting...
                </>
              ) : "Submit Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommentSection;
