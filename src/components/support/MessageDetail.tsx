
import React, { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, 
  Send, 
  Trash2, 
  Archive, 
  RefreshCw, 
  Mail, 
  Paperclip,
  CalendarDays
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/loading-spinner";

interface SupportResponse {
  id: string;
  message_id: string;
  body: string;
  html_body?: string;
  sent_by: string;
  sent_at: string;
  delivery_status?: string;
}

interface SupportMessage {
  id: string;
  subject: string;
  body: string;
  html_body?: string;
  sender_email: string;
  sender_name?: string;
  recipient: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  thread_id?: string;
  created_at: string;
  updated_at: string;
  read_at?: string;
  attachment_urls?: string[];
  response_count: number;
}

interface MessageDetailProps {
  message: SupportMessage;
  onClose: () => void;
  onStatusChange: () => void;
}

export const MessageDetail = ({ message, onClose, onStatusChange }: MessageDetailProps) => {
  const [responses, setResponses] = useState<SupportResponse[]>([]);
  const [isLoadingResponses, setIsLoadingResponses] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Get responses on component mount
  useEffect(() => {
    fetchResponses();
  }, [message.id]);

  // Fetch responses from the database
  const fetchResponses = async () => {
    setIsLoadingResponses(true);
    try {
      const { data, error } = await supabase
        .from('support_responses')
        .select('*')
        .eq('message_id', message.id)
        .order('sent_at', { ascending: true });
      
      if (error) throw error;
      setResponses(data || []);
    } catch (error) {
      console.error("Error fetching responses:", error);
      toast({
        title: "Error",
        description: "Failed to load message responses",
        variant: "destructive"
      });
    } finally {
      setIsLoadingResponses(false);
    }
  };

  // Handle sending a reply
  const handleSendReply = async () => {
    if (!replyContent.trim() || !user) return;
    
    setIsSending(true);
    try {
      const response = await supabase.functions.invoke('send-support-response', {
        body: {
          messageId: message.id,
          body: replyContent,
          userId: user.id
        }
      });
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      toast({
        title: "Reply Sent",
        description: "Your response has been sent successfully"
      });
      
      setReplyContent('');
      fetchResponses();
      onStatusChange();
    } catch (error) {
      console.error("Error sending reply:", error);
      toast({
        title: "Error",
        description: "Failed to send your response",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  // Handle archiving the message
  const handleArchive = async () => {
    try {
      const { error } = await supabase
        .from('support_messages')
        .update({ status: 'archived' })
        .eq('id', message.id);
      
      if (error) throw error;
      
      toast({
        title: "Message Archived",
        description: "The message has been moved to the archive"
      });
      
      onStatusChange();
      onClose();
    } catch (error) {
      console.error("Error archiving message:", error);
      toast({
        title: "Error",
        description: "Failed to archive the message",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-center bg-gray-50">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className="md:hidden mr-2" 
            onClick={onClose}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-lg font-semibold truncate">{message.subject || '(No Subject)'}</h2>
            <div className="text-sm text-gray-500">
              From: {message.sender_name || message.sender_email}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchResponses}
            title="Refresh responses"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleArchive}
            title="Archive message"
          >
            <Archive className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Message Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-gray-500 text-sm mb-1">
                <span className="font-medium">{message.sender_name || message.sender_email}</span>
                <span className="mx-2">&lt;{message.sender_email}&gt;</span>
              </div>
              <div className="text-gray-500 text-sm">
                To: {message.recipient}@tcgupdates.com
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="text-gray-500 text-xs flex items-center">
                <CalendarDays className="h-3 w-3 mr-1" />
                {formatDate(message.created_at)}
              </div>
              <Badge variant={
                message.status === 'new' ? 'default' : 
                message.status === 'read' ? 'secondary' : 
                message.status === 'replied' ? 'success' : 'outline'
              }>
                {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
              </Badge>
            </div>
          </div>
          
          {message.html_body ? (
            <div 
              className="prose prose-sm max-w-none" 
              dangerouslySetInnerHTML={{ __html: message.html_body }} 
            />
          ) : (
            <div className="prose prose-sm max-w-none whitespace-pre-wrap">
              {message.body}
            </div>
          )}
          
          {message.attachment_urls && message.attachment_urls.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="text-sm font-medium flex items-center">
                <Paperclip className="h-4 w-4 mr-2" />
                Attachments ({message.attachment_urls.length})
              </h4>
              <div className="mt-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {message.attachment_urls.map((url, index) => (
                  <a 
                    key={index} 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm block truncate"
                  >
                    {url.split('/').pop()}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Responses */}
        {isLoadingResponses ? (
          <div className="p-6 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : responses.length > 0 ? (
          <div className="divide-y">
            {responses.map((response) => (
              <div key={response.id} className="p-6 bg-blue-50">
                <div className="flex justify-between items-start mb-4">
                  <div className="text-gray-500 text-sm">
                    <span className="font-medium">Admin Response</span>
                    <span className="mx-2">from {message.recipient}@tcgupdates.com</span>
                  </div>
                  <div className="text-gray-500 text-xs">
                    {formatDate(response.sent_at)}
                  </div>
                </div>
                
                {response.html_body ? (
                  <div 
                    className="prose prose-sm max-w-none" 
                    dangerouslySetInnerHTML={{ __html: response.html_body }} 
                  />
                ) : (
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                    {response.body}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : null}
      </div>
      
      {/* Reply Form */}
      <div className="p-4 border-t bg-gray-50">
        <div className="mb-2">
          <label htmlFor="reply" className="text-sm font-medium">
            Reply as {message.recipient}@tcgupdates.com
          </label>
        </div>
        <Textarea
          id="reply"
          value={replyContent}
          onChange={(e) => setReplyContent(e.target.value)}
          placeholder="Type your reply here..."
          className="min-h-[120px] bg-white"
        />
        <div className="flex justify-end mt-3">
          <Button 
            type="button" 
            onClick={handleSendReply} 
            disabled={!replyContent.trim() || isSending}
          >
            {isSending ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Reply
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
