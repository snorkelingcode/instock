
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
}

const usernameSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be 20 characters or less")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
});

const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof usernameSchema>>({
    resolver: zodResolver(usernameSchema),
    defaultValues: {
      username: "",
    },
  });

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name")
        .eq("id", user.id)
        .single();
      
      if (error) throw error;
      
      setProfile(data);
      form.setValue("username", data.username);
    } catch (error: any) {
      console.error("Error fetching profile", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load your profile. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const onSubmit = async (values: z.infer<typeof usernameSchema>) => {
    if (!user) return;
    
    try {
      setIsUpdating(true);
      
      // Check if username is already taken
      const { data: existingUser, error: checkError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", values.username)
        .neq("id", user.id)
        .single();
      
      if (existingUser) {
        form.setError("username", { 
          message: "This username is already taken" 
        });
        return;
      }
      
      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }
      
      // Update profile
      const { error } = await supabase
        .from("profiles")
        .update({ username: values.username })
        .eq("id", user.id);
      
      if (error) throw error;
      
      setProfile(prev => prev ? { ...prev, username: values.username } : null);
      
      toast({
        title: "Profile updated",
        description: "Your username has been successfully updated."
      });
    } catch (error: any) {
      console.error("Error updating profile", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update your profile. Please try again."
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3"></div>
            <div className="h-10 bg-gray-200 rounded animate-pulse w-full"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Your Profile</CardTitle>
        <CardDescription>
          Update your username to personalize your experience
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter your username" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isUpdating}
            >
              {isUpdating ? "Updating..." : "Update Username"}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col text-sm text-gray-500">
        <p>Current username: <span className="font-semibold">{profile?.username}</span></p>
      </CardFooter>
    </Card>
  );
};

export default UserProfile;
