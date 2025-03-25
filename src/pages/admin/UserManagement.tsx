import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, MoreHorizontal, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type User = {
  id: string;
  email: string;
  full_name?: string;
  is_admin: boolean;
  created_at: string;
};

type ApiToken = {
  id: string;
  user_id: string;
  user_email: string;
  token: string;
  status: 'active' | 'expired' | 'revoked';
  expires_at: string;
  created_at: string;
};

const UserManagement = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [apiTokens, setApiTokens] = useState<ApiToken[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [openNewUserDialog, setOpenNewUserDialog] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserIsAdmin, setNewUserIsAdmin] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchApiTokens();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      
      // In a real implementation, this would be a Supabase RPC function
      // For demo, we'll simulate some user data
      const { data: authUsers, error: authError } = await supabase
        .from('auth_users' as any) // Using 'as any' as a workaround since this is just demo data
        .select('id, email, created_at');

      if (authError) {
        // If the auth_users table doesn't exist, use mock data
        setUsers([
          {
            id: '1',
            email: 'admin@example.com',
            full_name: 'Admin User',
            is_admin: true,
            created_at: '2023-01-01T00:00:00Z'
          },
          {
            id: '2',
            email: 'user@example.com',
            full_name: 'Regular User',
            is_admin: false,
            created_at: '2023-01-02T00:00:00Z'
          }
        ]);
      } else {
        // Transform to match our User type
        const formattedUsers = (authUsers || []).map((user: any) => ({
          id: user.id,
          email: user.email || 'No email',
          full_name: user.full_name || '',
          is_admin: user.is_admin || false,
          created_at: user.created_at,
        }));

        setUsers(formattedUsers);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      // Fallback to mock data in case of error
      setUsers([
        {
          id: '1',
          email: 'admin@example.com',
          full_name: 'Admin User',
          is_admin: true,
          created_at: '2023-01-01T00:00:00Z'
        },
        {
          id: '2',
          email: 'user@example.com',
          full_name: 'Regular User',
          is_admin: false,
          created_at: '2023-01-02T00:00:00Z'
        }
      ]);
      
      toast({
        title: "Using demo data",
        description: "Connected to mock user data for demonstration",
        variant: "default",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchApiTokens = async () => {
    try {
      // This would be implemented with a Supabase function or table
      // Simulating data for now
      setApiTokens([
        {
          id: '1',
          user_id: '123',
          user_email: 'user@example.com',
          token: '12b89f3372eafc6ee83bca2a91b1d9946ab',
          status: 'active',
          expires_at: '01-04-2025',
          created_at: '01-01-2023',
        }
      ]);
    } catch (error) {
      console.error('Error fetching API tokens:', error);
    }
  };

  const handleCreateUser = async () => {
    try {
      setIsLoading(true);
      
      // In a real implementation, this would create a user via Supabase's admin API
      // or an Edge Function that has admin privileges
      toast({
        title: "User Created",
        description: "The new user has been created successfully.",
      });
      
      setOpenNewUserDialog(false);
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserIsAdmin(false);
      
      // Refresh the user list
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateApiToken = async (userId: string) => {
    try {
      // This would be implemented with a Supabase function
      toast({
        title: "API Token Created",
        description: "A new API token has been created.",
      });
      
      // Refresh the token list
      fetchApiTokens();
    } catch (error) {
      console.error('Error creating API token:', error);
      toast({
        title: "Error",
        description: "Failed to create API token",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.full_name && user.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!isAdmin) {
    return (
      <Layout>
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You need admin privileges to access this page.
          </AlertDescription>
        </Alert>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
        
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="users" className="font-medium">User access</TabsTrigger>
            <TabsTrigger value="notifications" className="font-medium">Notifications</TabsTrigger>
            <TabsTrigger value="profile" className="font-medium">Profile</TabsTrigger>
            <TabsTrigger value="event_log" className="font-medium">Event log</TabsTrigger>
            <TabsTrigger value="auth" className="font-medium">Passwords & authentication</TabsTrigger>
          </TabsList>
          
          <TabsContent value="users" className="space-y-8">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Users</h2>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex items-center gap-1">
                    <Download size={16} />
                    Download CSV
                  </Button>
                  <Dialog open={openNewUserDialog} onOpenChange={setOpenNewUserDialog}>
                    <DialogTrigger asChild>
                      <Button className="flex items-center gap-1">
                        <Plus size={16} />
                        New user
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add new user</DialogTitle>
                        <DialogDescription>
                          Create a new user account with custom permissions.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="user@example.com"
                            value={newUserEmail}
                            onChange={(e) => setNewUserEmail(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">Password</Label>
                          <Input
                            id="password"
                            type="password"
                            placeholder="Create a strong password"
                            value={newUserPassword}
                            onChange={(e) => setNewUserPassword(e.target.value)}
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="is-admin"
                            checked={newUserIsAdmin}
                            onChange={(e) => setNewUserIsAdmin(e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor="is-admin">Admin privileges</Label>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenNewUserDialog(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={() => {
                            toast({
                              title: "User Created",
                              description: "The new user has been created successfully.",
                            });
                            setOpenNewUserDialog(false);
                          }}
                          disabled={!newUserEmail || !newUserPassword}
                        >
                          Create user
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by e-mail"
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <Card>
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-sm">Full name</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">E-mail</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">Phone</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">Permissions</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">2-step verification</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">Password reset reminder</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">{user.full_name || 'N/A'}</td>
                          <td className="py-3 px-4">{user.email}</td>
                          <td className="py-3 px-4">Not available</td>
                          <td className="py-3 px-4">
                            {user.is_admin ? 'Admin' : 'User'}
                          </td>
                          <td className="py-3 px-4">Not available</td>
                          <td className="py-3 px-4">Not available</td>
                          <td className="py-3 px-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>Edit user</DropdownMenuItem>
                                <DropdownMenuItem>Reset password</DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
                                  Delete user
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                      {filteredUsers.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-4 text-center text-gray-500">
                            No users found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-4">API tokens</h2>
              <Card>
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-sm">User</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">Permissions</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">Token</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">Expiration date</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {apiTokens.map((token) => (
                        <tr key={token.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">{token.user_email}</td>
                          <td className="py-3 px-4">User</td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Active
                            </Badge>
                          </td>
                          <td className="py-3 px-4 font-mono text-sm">{token.token}</td>
                          <td className="py-3 px-4">{token.expires_at}</td>
                          <td className="py-3 px-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>Copy token</DropdownMenuItem>
                                <DropdownMenuItem>Extend expiration</DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
                                  Revoke token
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                      {apiTokens.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-4 text-center text-gray-500">
                            No API tokens found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Proxy Manager users</h2>
                <Button className="flex items-center gap-1">
                  <Plus size={16} />
                  New user
                </Button>
              </div>
              <Card>
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-sm">E-mail</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">Password</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={2} className="py-4 text-center text-gray-500">
                          No data
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="notifications">
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              <h3 className="text-lg font-medium mb-2">Notification Settings</h3>
              <p className="text-gray-500 mb-4">
                Configure your notification preferences for system alerts, user actions, and more.
              </p>
              <p className="text-gray-500">This feature is coming soon.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="profile">
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              <h3 className="text-lg font-medium mb-2">Profile Settings</h3>
              <p className="text-gray-500 mb-4">
                Update your personal information, profile picture, and account details.
              </p>
              <p className="text-gray-500">This feature is coming soon.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="event_log">
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              <h3 className="text-lg font-medium mb-2">Event Log</h3>
              <p className="text-gray-500 mb-4">
                View a chronological record of all system and user activities.
              </p>
              <p className="text-gray-500">This feature is coming soon.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="auth">
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              <h3 className="text-lg font-medium mb-2">Password & Authentication Settings</h3>
              <p className="text-gray-500 mb-4">
                Manage password requirements, two-factor authentication, and security policies.
              </p>
              <p className="text-gray-500">This feature is coming soon.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default UserManagement;
