
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Mail, Paperclip } from "lucide-react";
import LoadingSpinner from "@/components/ui/loading-spinner";

interface SupportMessage {
  id: string;
  subject: string;
  sender_email: string;
  sender_name?: string;
  recipient: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  created_at: string;
  attachment_urls?: string[];
  response_count: number;
}

interface MessageListProps {
  messages: SupportMessage[];
  isLoading: boolean;
  onSelect: (message: SupportMessage) => void;
  selectedId?: string;
}

export const MessageList = ({ messages, isLoading, onSelect, selectedId }: MessageListProps) => {
  // Format date to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get the display name of the sender
  const getSenderName = (message: SupportMessage) => {
    if (message.sender_name) return message.sender_name;
    return message.sender_email.split('@')[0];
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-full p-8 text-center">
        <Mail className="h-12 w-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No messages found</h3>
        <p className="text-gray-500 mt-1">There are no messages in this category</p>
      </div>
    );
  }

  return (
    <div className="divide-y overflow-auto h-full">
      {messages.map((message) => (
        <div 
          key={message.id} 
          className={`p-4 hover:bg-gray-50 cursor-pointer ${selectedId === message.id ? 'bg-blue-50' : ''}`}
          onClick={() => onSelect(message)}
        >
          <div className="flex justify-between items-start mb-1">
            <div className="flex items-center">
              <span className="font-medium text-gray-900">{getSenderName(message)}</span>
              {message.status === 'new' && (
                <Badge className="ml-2 bg-blue-500">New</Badge>
              )}
            </div>
            <div className="text-xs text-gray-500 flex items-center">
              <CalendarIcon className="h-3 w-3 mr-1" />
              {formatDate(message.created_at)}
            </div>
          </div>
          
          <h4 className="font-medium text-gray-800 mb-1 truncate">
            {message.subject || '(No Subject)'}
          </h4>
          
          <div className="flex justify-between items-center mt-2">
            <div className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded-full">
              {message.recipient}@tcgupdates.com
            </div>
            
            <div className="flex items-center space-x-2">
              {message.attachment_urls && message.attachment_urls.length > 0 && (
                <span className="text-gray-500 flex items-center text-xs">
                  <Paperclip className="h-3 w-3 mr-1" />
                  {message.attachment_urls.length}
                </span>
              )}
              
              {message.response_count > 0 && (
                <Badge variant="outline" className="text-xs">
                  {message.response_count} {message.response_count === 1 ? 'response' : 'responses'}
                </Badge>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
