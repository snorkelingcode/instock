
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface AccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AccountModal: React.FC<AccountModalProps> = ({ open, onOpenChange }) => {
  const { user, signOut } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { toast } = useToast();

  const handleUpdatePassword = async () => {
    if (!password) {
      toast({
        title: "Error",
        description: "Please enter a new password",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      toast({
        title: "Password updated",
        description: "Your password has been successfully updated",
      });
      setPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Account Settings</DialogTitle>
          <DialogDescription>
            Manage your account information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input 
              value={user?.email || ""} 
              disabled 
              className="bg-gray-100"
            />
            <p className="text-sm text-gray-500">
              Your email address cannot be changed
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input 
              id="password"
              type="password" 
              placeholder="Enter new password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input 
              id="confirmPassword"
              type="password" 
              placeholder="Confirm new password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between">
          <div className="order-2 sm:order-1">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full sm:w-auto">
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account
                    and remove all your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={signOut} 
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          
          <div className="order-1 sm:order-2 mb-3 sm:mb-0">
            <Button 
              onClick={handleUpdatePassword} 
              disabled={isUpdating}
              className="w-full sm:w-auto"
            >
              {isUpdating ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Updating...
                </>
              ) : "Update Password"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AccountModal;
