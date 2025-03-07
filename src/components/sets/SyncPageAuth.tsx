
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SyncPageAuthProps {
  onAuthenticated: () => void;
}

const SyncPageAuth: React.FC<SyncPageAuthProps> = ({ onAuthenticated }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { toast } = useToast();
  
  // Check for previously stored auth state
  useEffect(() => {
    const isAuthenticated = localStorage.getItem("syncPageAuthenticated");
    if (isAuthenticated === "true") {
      onAuthenticated();
    }
  }, [onAuthenticated]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // This is a simple implementation - in production, you'd want to use a more secure approach
    // Like checking against a value stored securely in your database or environment variables
    const correctPassword = "tcg-admin-123"; // Change this to your desired password
    
    if (password === correctPassword) {
      localStorage.setItem("syncPageAuthenticated", "true");
      toast({
        title: "Success",
        description: "Authentication successful",
      });
      onAuthenticated();
    } else {
      setError("Incorrect password");
      toast({
        title: "Error",
        description: "Authentication failed. Incorrect password.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[50vh] p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">TCG Sync Authentication</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                This page is password protected to prevent unauthorized API calls.
              </p>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className={error ? "border-red-500" : ""}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
            <Button type="submit" className="w-full">
              Authenticate
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SyncPageAuth;
