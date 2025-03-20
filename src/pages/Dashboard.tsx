
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarIcon, BookOpenIcon, BellIcon, ClockIcon } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useMetaTags } from "@/hooks/use-meta-tags";
import { supabase } from "@/integrations/supabase/client";
import LoadingSpinner from "@/components/ui/loading-spinner";

interface UserComment {
  id: string;
  article_id: string;
  article_title: string;
  content: string;
  created_at: string;
}

const Dashboard = () => {
  const { user, isLoading, signOut } = useAuth();
  const [userComments, setUserComments] = useState<UserComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const navigate = useNavigate();
  
  useMetaTags({
    title: "My Dashboard | TCG Updates",
    description: "View your profile, activity, and manage your TCG Updates account.",
  });

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    } else if (user) {
      fetchUserComments();
    }
  }, [user, isLoading, navigate]);

  const fetchUserComments = async () => {
    if (!user) return;
    
    setIsLoadingComments(true);
    try {
      const { data, error } = await supabase
        .from("article_comments")
        .select(`
          id,
          content,
          created_at,
          article_id,
          articles(title)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        const formattedComments = data.map(item => ({
          id: item.id,
          article_id: item.article_id,
          article_title: item.articles?.title || "Unknown Article",
          content: item.content,
          created_at: item.created_at
        }));
        
        setUserComments(formattedComments);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto py-16 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-red-50 to-white p-6 rounded-lg shadow-md mb-6">
            <h1 className="text-2xl font-bold mb-2">Welcome, {user?.email}</h1>
            <p className="text-gray-600">
              Manage your profile, view your activity, and customize your TCG Updates experience.
            </p>
          </div>

          <Tabs defaultValue="activity" className="w-full mb-8">
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="comments">My Comments</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
            </TabsList>
            
            <TabsContent value="activity">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <BookOpenIcon className="mr-2 h-5 w-5 text-red-600" />
                      Recent Reads
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-500 text-sm">
                      You haven't read any articles yet. Explore our latest news!
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" size="sm" onClick={() => navigate("/news")}>
                      Browse News
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <BellIcon className="mr-2 h-5 w-5 text-red-600" />
                      Notifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-500 text-sm">
                      No new notifications. You're all caught up!
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" size="sm" disabled>
                      View All
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="comments">
              <Card>
                <CardHeader>
                  <CardTitle>Your Comments</CardTitle>
                  <CardDescription>
                    Comments you've posted on articles across TCG Updates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingComments ? (
                    <div className="flex justify-center py-8">
                      <LoadingSpinner />
                    </div>
                  ) : userComments.length > 0 ? (
                    <div className="space-y-4">
                      {userComments.map((comment) => (
                        <div key={comment.id} className="border-b pb-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium">
                              <a 
                                href={`/article/${comment.article_id}`}
                                className="text-red-600 hover:underline"
                              >
                                {comment.article_title}
                              </a>
                            </h3>
                            <span className="text-xs text-gray-500 flex items-center">
                              <ClockIcon className="h-3 w-3 mr-1" />
                              {formatDate(comment.created_at)}
                            </span>
                          </div>
                          <p className="text-gray-700 text-sm">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-500 mb-4">You haven't posted any comments yet.</p>
                      <Button onClick={() => navigate("/news")} size="sm">
                        Browse Articles
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Email</h3>
                    <p>{user?.email}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Member Since</h3>
                    <p className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                      {user?.created_at ? formatDate(user.created_at) : "N/A"}
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => signOut()}>
                    Sign Out
                  </Button>
                  <Button variant="destructive" disabled>
                    Delete Account
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
