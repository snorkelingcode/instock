
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shell } from "@/components/layout/Shell";
import RequireAdmin from "@/components/auth/RequireAdmin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Mail, MessageSquare, RefreshCw, Inbox, Archive, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { MessageList } from "@/components/support/MessageList";
import { MessageDetail } from "@/components/support/MessageDetail";
import { useToast } from "@/hooks/use-toast";

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

const SupportMessages = () => {
  const [activeTab, setActiveTab] = useState<string>("new");
  const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null);
  const { toast } = useToast();

  const fetchMessages = async (status: string | null) => {
    const { data, error } = await supabase.rpc('get_support_messages', { 
      _status: status,
      _limit: 100,
      _offset: 0
    });
    
    if (error) throw error;
    return data as SupportMessage[];
  };

  const { data: messages, isLoading, error, refetch } = useQuery({
    queryKey: ['support-messages', activeTab],
    queryFn: () => fetchMessages(activeTab !== 'all' ? activeTab : null),
  });

  const refreshMessages = () => {
    refetch();
    toast({
      title: "Refreshed",
      description: "Support messages have been refreshed",
    });
  };

  const handleSelectMessage = async (message: SupportMessage) => {
    setSelectedMessage(message);
    
    // If message is new, mark it as read
    if (message.status === 'new') {
      try {
        await supabase
          .from('support_messages')
          .update({ 
            status: 'read',
            read_at: new Date().toISOString()
          })
          .eq('id', message.id);
          
        // Refetch to update counts
        refetch();
      } catch (error) {
        console.error("Error marking message as read:", error);
      }
    }
  };

  const handleCloseDetail = () => {
    setSelectedMessage(null);
    refetch();
  };

  if (error) {
    console.error("Error fetching support messages:", error);
    return (
      <Shell>
        <Card className="my-8">
          <CardContent className="p-6 text-center">
            <p className="text-red-500">Error loading support messages. Please try again later.</p>
          </CardContent>
        </Card>
      </Shell>
    );
  }

  return (
    <RequireAdmin>
      <Shell>
        <div className="container max-w-7xl py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Support Messages</h1>
            <Button variant="outline" onClick={refreshMessages}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Message Center</CardTitle>
                  <CardDescription>Manage support inquiries from your users</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="new" value={activeTab} onValueChange={setActiveTab}>
                <div className="border-b px-6">
                  <TabsList className="w-full justify-start rounded-none border-b-0 bg-transparent p-0">
                    <TabsTrigger
                      value="new"
                      className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
                    >
                      <Inbox className="mr-2 h-4 w-4" />
                      New
                    </TabsTrigger>
                    <TabsTrigger
                      value="read"
                      className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Read
                    </TabsTrigger>
                    <TabsTrigger
                      value="replied"
                      className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Replied
                    </TabsTrigger>
                    <TabsTrigger
                      value="archived"
                      className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
                    >
                      <Archive className="mr-2 h-4 w-4" />
                      Archived
                    </TabsTrigger>
                    <TabsTrigger
                      value="all"
                      className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
                    >
                      All Messages
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <div className="flex h-[calc(100vh-350px)] min-h-[500px]">
                  <div className={`w-full p-0 ${selectedMessage ? 'hidden md:block md:w-1/3' : 'w-full'}`}>
                    <TabsContent value="new" className="h-full m-0">
                      <MessageList 
                        messages={messages || []} 
                        isLoading={isLoading} 
                        onSelect={handleSelectMessage}
                        selectedId={selectedMessage?.id}
                      />
                    </TabsContent>
                    <TabsContent value="read" className="h-full m-0">
                      <MessageList 
                        messages={messages || []} 
                        isLoading={isLoading} 
                        onSelect={handleSelectMessage}
                        selectedId={selectedMessage?.id}
                      />
                    </TabsContent>
                    <TabsContent value="replied" className="h-full m-0">
                      <MessageList 
                        messages={messages || []} 
                        isLoading={isLoading} 
                        onSelect={handleSelectMessage}
                        selectedId={selectedMessage?.id}
                      />
                    </TabsContent>
                    <TabsContent value="archived" className="h-full m-0">
                      <MessageList 
                        messages={messages || []} 
                        isLoading={isLoading} 
                        onSelect={handleSelectMessage}
                        selectedId={selectedMessage?.id}
                      />
                    </TabsContent>
                    <TabsContent value="all" className="h-full m-0">
                      <MessageList 
                        messages={messages || []} 
                        isLoading={isLoading} 
                        onSelect={handleSelectMessage}
                        selectedId={selectedMessage?.id}
                      />
                    </TabsContent>
                  </div>
                  
                  {selectedMessage && (
                    <div className="w-full md:w-2/3 border-l">
                      <MessageDetail 
                        message={selectedMessage} 
                        onClose={handleCloseDetail} 
                        onStatusChange={refetch}
                      />
                    </div>
                  )}
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </Shell>
    </RequireAdmin>
  );
};

export default SupportMessages;
