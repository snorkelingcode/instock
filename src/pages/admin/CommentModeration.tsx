
import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import RequireAdmin from '@/components/auth/RequireAdmin';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CommentReport } from '@/types/comment';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/ui/loading-spinner';
import {
  Flag,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
  MessageSquare,
  User,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const CommentModeration = () => {
  const [reports, setReports] = useState<CommentReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionStatus, setResolutionStatus] = useState('rejected');
  const [resolvingReportId, setResolvingReportId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedReports, setExpandedReports] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchReports(activeTab);
  }, [activeTab]);

  const fetchReports = async (status: string) => {
    setIsLoading(true);
    try {
      // Fetch reports directly instead of using nested selects for better type compatibility
      let query = supabase.from('comment_reports');
      
      // Build query with filters
      if (status === 'pending') {
        query = query.eq('status', 'pending');
      } else if (status === 'resolved') {
        query = query.neq('status', 'pending');
      }
      
      // Run the query
      const { data: reportData, error } = await query
        .select()
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (!reportData || reportData.length === 0) {
        setReports([]);
        setIsLoading(false);
        return;
      }
      
      // Get comment data for all reports
      const commentIds = reportData.map(report => report.comment_id);
      
      const { data: commentsData, error: commentsError } = await supabase
        .from('article_comments')
        .select(`
          id,
          content,
          article_id,
          user_id
        `)
        .in('id', commentIds);
      
      if (commentsError) throw commentsError;
      
      // Get article titles
      const articleIds = commentsData.map(comment => comment.article_id);
      
      const { data: articlesData, error: articlesError } = await supabase
        .from('articles')
        .select('id, title')
        .in('id', articleIds);
      
      if (articlesError) throw articlesError;
      
      // Get display names for reporter and resolver
      const userIds = [
        ...reportData.map(report => report.reporter_id),
        ...reportData.filter(report => report.resolved_by).map(report => report.resolved_by as string)
      ].filter(Boolean);
      
      const { data: displayNames, error: namesError } = await supabase
        .rpc('get_user_display_names', {
          user_ids: userIds
        });
      
      if (namesError) throw namesError;
      
      // Create a map for easier lookup
      const displayNameMap: Record<string, string> = {};
      if (displayNames) {
        displayNames.forEach((item: any) => {
          if (item && item.id && item.display_user_id) {
            displayNameMap[item.id] = item.display_user_id;
          }
        });
      }
      
      const commentMap = commentsData.reduce((acc, comment) => {
        acc[comment.id] = comment;
        return acc;
      }, {} as Record<string, any>);
      
      const articleMap = articlesData.reduce((acc, article) => {
        acc[article.id] = article;
        return acc;
      }, {} as Record<string, any>);
      
      // Format the reports with all necessary data
      const formattedReports: CommentReport[] = reportData.map(report => {
        const comment = commentMap[report.comment_id];
        const article = comment && comment.article_id ? articleMap[comment.article_id] : null;
        
        return {
          id: report.id,
          comment_id: report.comment_id,
          reporter_id: report.reporter_id,
          reporter_name: displayNameMap[report.reporter_id] || `user_${report.reporter_id.substring(0, 8)}`,
          reason: report.reason,
          status: report.status,
          created_at: report.created_at,
          resolved_at: report.resolved_at,
          resolved_by: report.resolved_by,
          resolver_name: report.resolved_by ? (displayNameMap[report.resolved_by] || `user_${report.resolved_by.substring(0, 8)}`) : undefined,
          resolution_notes: report.resolution_notes,
          comment_content: comment ? comment.content : 'Comment not found',
          article_id: comment ? comment.article_id : '',
          article_title: article ? article.title : 'Unknown article'
        };
      });
      
      setReports(formattedReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: 'Error',
        description: 'Failed to load comment reports.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolveReport = async (reportId: string) => {
    setResolvingReportId(reportId);
    setIsSubmitting(true);

    try {
      const report = reports.find(r => r.id === reportId);
      if (!report) throw new Error('Report not found');

      const { data: auth } = await supabase.auth.getSession();
      if (!auth.session?.user.id) throw new Error('Not authenticated');
      
      // Update the report status
      const { error: updateError } = await supabase
        .from('comment_reports')
        .update({
          status: resolutionStatus,
          resolved_at: new Date().toISOString(),
          resolved_by: auth.session.user.id,
          resolution_notes: resolutionNotes
        })
        .eq('id', reportId);

      if (updateError) throw updateError;

      // If status is "upheld", delete the reported comment
      if (resolutionStatus === 'upheld') {
        const { error: deleteError } = await supabase
          .from('article_comments')
          .delete()
          .eq('id', report.comment_id);

        if (deleteError) throw deleteError;
      }

      toast({
        title: 'Report resolved',
        description: 'The report has been successfully processed.',
      });

      // Refresh reports
      fetchReports(activeTab);
      
      // Reset form
      setResolutionNotes('');
      setResolutionStatus('rejected');
      setResolvingReportId(null);

    } catch (error) {
      console.error('Error resolving report:', error);
      toast({
        title: 'Error',
        description: 'Failed to resolve the report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleReportExpansion = (reportId: string) => {
    setExpandedReports(prev => ({
      ...prev,
      [reportId]: !prev[reportId]
    }));
  };

  const getReportStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending Review</Badge>;
      case 'upheld':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Upheld</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case 'spam':
        return 'Spam or advertising';
      case 'harassment':
        return 'Harassment or bullying';
      case 'inappropriate':
        return 'Inappropriate content';
      case 'misinformation':
        return 'Misinformation';
      case 'other':
        return 'Other';
      default:
        return reason;
    }
  };

  const getUserInitials = (displayName: string) => {
    return displayName.substring(0, 2).toUpperCase();
  };

  return (
    <RequireAdmin>
      <Layout>
        <div className="container py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Comment Moderation</h1>
          </div>

          <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="pending" className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Pending
                </TabsTrigger>
                <TabsTrigger value="resolved" className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Resolved
                </TabsTrigger>
                <TabsTrigger value="all" className="flex items-center gap-2">
                  <Flag className="h-4 w-4" />
                  All Reports
                </TabsTrigger>
              </TabsList>
            </div>

            {['pending', 'resolved', 'all'].map(tab => (
              <TabsContent key={tab} value={tab} className="mt-0">
                {isLoading ? (
                  <div className="flex justify-center py-20">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : reports.length > 0 ? (
                  <div className="space-y-4">
                    {reports.map(report => (
                      <Card key={report.id} className="overflow-hidden">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Flag className={`h-5 w-5 ${report.status === 'pending' ? 'text-yellow-500' : report.status === 'upheld' ? 'text-red-500' : 'text-green-500'}`} />
                              <CardTitle className="text-lg">
                                Report {report.id.slice(0, 8)}
                              </CardTitle>
                              {getReportStatusBadge(report.status)}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleReportExpansion(report.id)}
                              className="hover:bg-gray-100"
                            >
                              {expandedReports[report.id] ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <CardDescription className="flex items-center text-sm">
                            <Clock className="h-3 w-3 mr-1" />
                            Reported {formatDate(report.created_at)}
                          </CardDescription>
                        </CardHeader>

                        <CardContent className="pb-3">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-sm">
                              <User className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-700">Reported by:</span>
                              <span className="font-medium">{report.reporter_name}</span>
                            </div>

                            <div className="flex items-start gap-2 text-sm">
                              <Flag className="h-4 w-4 text-gray-500 mt-1" />
                              <span className="text-gray-700">Reason:</span>
                              <span className="font-medium">{getReasonLabel(report.reason)}</span>
                            </div>

                            <div className="text-sm flex items-start gap-2">
                              <MessageSquare className="h-4 w-4 text-gray-500 mt-1" />
                              <div>
                                <span className="text-gray-700">Comment:</span>
                                <p className="font-medium mt-1 bg-gray-50 p-3 rounded-md border border-gray-100">
                                  {report.comment_content}
                                </p>
                              </div>
                            </div>

                            <div className="text-sm flex items-center gap-2">
                              <ExternalLink className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-700">Article:</span>
                              <Link 
                                to={`/articles/${report.article_id}`} 
                                className="text-blue-600 hover:underline"
                              >
                                {report.article_title}
                              </Link>
                            </div>
                          </div>

                          {expandedReports[report.id] && report.status !== 'pending' && (
                            <div className="mt-4 pt-3 border-t border-gray-200">
                              <h4 className="font-medium mb-2">Resolution Details</h4>
                              <div className="flex flex-col gap-2 text-sm">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-gray-500" />
                                  <span className="text-gray-700">Resolved:</span>
                                  <span>{formatDate(report.resolved_at || '')}</span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-gray-500" />
                                  <span className="text-gray-700">Resolved by:</span>
                                  <span>{report.resolver_name}</span>
                                </div>

                                {report.resolution_notes && (
                                  <div className="flex items-start gap-2">
                                    <MessageSquare className="h-4 w-4 text-gray-500 mt-1" />
                                    <div>
                                      <span className="text-gray-700">Notes:</span>
                                      <p className="mt-1 bg-gray-50 p-3 rounded-md border border-gray-100">
                                        {report.resolution_notes}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </CardContent>

                        {report.status === 'pending' && (
                          <CardFooter className="bg-gray-50 border-t flex justify-end gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button>Resolve Report</Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Resolve Comment Report</DialogTitle>
                                  <DialogDescription>
                                    Review the reported comment and take appropriate action.
                                  </DialogDescription>
                                </DialogHeader>

                                <div className="py-4">
                                  <div className="mb-4">
                                    <h4 className="text-sm font-medium mb-2">Comment</h4>
                                    <div className="bg-gray-50 p-3 rounded-md border border-gray-100">
                                      {report.comment_content}
                                    </div>
                                  </div>

                                  <div className="mb-4">
                                    <h4 className="text-sm font-medium mb-2">Resolution</h4>
                                    <Select value={resolutionStatus} onValueChange={setResolutionStatus}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select action" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="upheld">
                                          <span className="flex items-center">
                                            <CheckCircle className="h-4 w-4 mr-2 text-red-500" />
                                            Uphold report and delete comment
                                          </span>
                                        </SelectItem>
                                        <SelectItem value="rejected">
                                          <span className="flex items-center">
                                            <XCircle className="h-4 w-4 mr-2 text-green-500" />
                                            Reject report and keep comment
                                          </span>
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div>
                                    <h4 className="text-sm font-medium mb-2">Notes (optional)</h4>
                                    <Textarea
                                      placeholder="Add any notes about this resolution..."
                                      value={resolutionNotes}
                                      onChange={(e) => setResolutionNotes(e.target.value)}
                                    />
                                  </div>
                                </div>

                                <DialogFooter>
                                  <DialogClose asChild>
                                    <Button variant="outline">Cancel</Button>
                                  </DialogClose>
                                  <Button 
                                    onClick={() => handleResolveReport(report.id)}
                                    disabled={isSubmitting}
                                    className={resolutionStatus === 'upheld' ? 'bg-red-600 hover:bg-red-700' : ''}
                                  >
                                    {isSubmitting && resolvingReportId === report.id ? (
                                      <>
                                        <LoadingSpinner size="sm" className="mr-2" />
                                        Processing...
                                      </>
                                    ) : resolutionStatus === 'upheld' ? (
                                      'Delete Comment'
                                    ) : (
                                      'Keep Comment'
                                    )}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </CardFooter>
                        )}
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Flag className="h-16 w-16 text-gray-300 mb-4" />
                      <h3 className="text-xl font-medium mb-1">No reports found</h3>
                      <p className="text-gray-500 text-center max-w-md">
                        {tab === 'pending' 
                          ? 'There are no pending comment reports that require moderation.'
                          : tab === 'resolved'
                            ? 'No resolved reports to display.' 
                            : 'No comment reports have been submitted yet.'}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </Layout>
    </RequireAdmin>
  );
};

export default CommentModeration;
