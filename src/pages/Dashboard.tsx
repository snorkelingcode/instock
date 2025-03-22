
import React, { useState, useEffect } from 'react';
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CalendarDays, MessageSquare, User, FileText, Clock, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { Link } from 'react-router-dom';
import AccountModal from "@/components/auth/AccountModal";

interface UserComment {
  id: string;
  articleId: string;
  articleTitle: string;
  content: string;
  created_at: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userComments, setUserComments] = useState<UserComment[]>([]);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isDeletingComment, setIsDeletingComment] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchUserComments();
    }
  }, [user]);

  const fetchUserComments = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('article_comments')
        .select(`
          id,
          article_id,
          articles:article_id(title),
          content,
          created_at
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const formattedComments = data.map(item => ({
        id: item.id,
        articleId: item.article_id,
        articleTitle: item.articles?.title || 'Unknown Article',
        content: item.content,
        created_at: item.created_at
      }));
      
      setUserComments(formattedComments);
    } catch (error) {
      console.error('Error fetching user comments:', error);
      toast({
        title: "Error",
        description: "Failed to load your comments. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      setIsDeletingComment(commentId);
      
      const { error } = await supabase
        .from('article_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user?.id);
      
      if (error) throw error;
      
      setUserComments(userComments.filter(comment => comment.id !== commentId));
      
      toast({
        title: "Comment deleted",
        description: "Your comment has been successfully deleted.",
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Error",
        description: "Failed to delete your comment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeletingComment(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getUserInitials = () => {
    if (user?.user_metadata?.display_user_id) {
      return user.user_metadata.display_user_id.substring(0, 2).toUpperCase();
    }
    if (!user?.email) return 'U';
    return user.email.substring(0, 2).toUpperCase();
  };

  const getDisplayName = () => {
    return user?.user_metadata?.display_user_id || user?.email || 'User';
  };

  return (
    <Layout>
      <div className="container max-w-6xl py-8">
        <h1 className="text-3xl font-bold mb-8">Your Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* User Profile Card */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarFallback className="bg-red-100 text-red-600 text-xl">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-medium mb-2">{getDisplayName()}</h3>
              <div className="flex items-center text-sm text-gray-500 mb-4">
                <User className="mr-2 h-4 w-4" />
                <span>User ID: {user?.id.substring(0, 8)}...</span>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <CalendarDays className="mr-2 h-4 w-4" />
                <span>Member since: {user?.created_at ? formatDate(user.created_at) : 'N/A'}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => setIsAccountModalOpen(true)}
              >
                Manage Account
              </Button>
            </CardFooter>
          </Card>
          
          {/* User Activity Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your recent comments and interactions</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : userComments.length > 0 ? (
                <div className="space-y-4">
                  {userComments.map(comment => (
                    <div key={comment.id} className="border-b border-gray-100 pb-4 last:border-0">
                      <div className="flex justify-between items-start mb-2">
                        <Link to={`/article/${comment.articleId}`} className="font-medium text-blue-600 hover:underline">
                          {comment.articleTitle}
                        </Link>
                        <Badge variant="outline" className="text-xs">
                          <Clock className="mr-1 h-3 w-3" />
                          {formatDate(comment.created_at)}
                        </Badge>
                      </div>
                      <p className="text-gray-700 line-clamp-2">{comment.content}</p>
                      <div className="mt-2 flex justify-end gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/article/${comment.articleId}`}>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            View Comment
                          </Link>
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Comment</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this comment? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteComment(comment.id)}
                                className="bg-red-600 hover:bg-red-700"
                                disabled={isDeletingComment === comment.id}
                              >
                                {isDeletingComment === comment.id ? (
                                  <>
                                    <LoadingSpinner size="sm" className="mr-2" />
                                    Deleting...
                                  </>
                                ) : "Delete Comment"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed border-gray-200 rounded-lg">
                  <FileText className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                  <h3 className="text-lg font-medium mb-1">No Comments Yet</h3>
                  <p className="text-gray-500 mb-4">You haven't commented on any articles yet.</p>
                  <Button asChild>
                    <Link to="/news">Browse Articles</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Account Management Modal */}
        <AccountModal 
          open={isAccountModalOpen}
          onOpenChange={setIsAccountModalOpen}
        />
      </div>
    </Layout>
  );
};

export default Dashboard;
