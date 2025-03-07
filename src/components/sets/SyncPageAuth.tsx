
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { LockIcon, ShieldIcon } from "lucide-react";

interface SyncPageAuthProps {
  onAuthenticated: () => void;
}

const SyncPageAuth: React.FC<SyncPageAuthProps> = ({ onAuthenticated }) => {
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Check for previously stored auth session
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Check if user has admin role
        try {
          const { data, error } = await supabase.rpc('has_role', {
            _user_id: session.user.id,
            _role: 'admin'
          });
          
          if (data && !error) {
            localStorage.setItem("syncPageAuthenticated", "true");
            onAuthenticated();
          }
        } catch (error) {
          console.error("Error checking admin role:", error);
        }
      }
    };
    
    checkSession();
  }, [onAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    try {
      // Use Supabase auth with email/password
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        throw error;
      }
      
      // Check if user has admin role
      const { data: isAdmin, error: roleError } = await supabase.rpc('has_role', {
        _user_id: data.user?.id,
        _role: 'admin'
      });
      
      if (roleError) {
        throw roleError;
      }
      
      if (!isAdmin) {
        throw new Error("This account doesn't have admin privileges");
      }
      
      // Success
      localStorage.setItem("syncPageAuthenticated", "true");
      toast({
        title: "Success",
        description: "Authentication successful",
      });
      onAuthenticated();
    } catch (err: any) {
      console.error("Authentication error:", err);
      setError(err.message || "Authentication failed");
      toast({
        title: "Error",
        description: err.message || "Authentication failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[50vh] p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-center mb-2">
            <ShieldIcon className="h-8 w-8 text-primary mr-2" />
            <CardTitle className="text-center">Admin Authentication</CardTitle>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            This page requires admin privileges
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Admin Email"
                disabled={isLoading}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className={error ? "border-red-500" : ""}
                disabled={isLoading}
                required
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Authenticating...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <LockIcon className="h-4 w-4 mr-2" />
                  Authenticate
                </span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SyncPageAuth;
