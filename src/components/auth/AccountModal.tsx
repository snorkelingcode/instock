import React, { useState, useEffect } from 'react';
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
import TwoFactorVerification from "./TwoFactorVerification";

interface AccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AccountModal: React.FC<AccountModalProps> = ({ open, onOpenChange }) => {
  const { user, signOut, refreshSession } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayUserId, setDisplayUserId] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      // Set display user ID from user metadata or generate from system ID
      setDisplayUserId(user.user_metadata?.display_user_id || `user_${user.id.substring(0, 8)}`);
    }
  }, [user]);

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
      setIsVerified(false);
      setIsChangingPassword(false);
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

  const handleUpdateUserId = async () => {
    if (!displayUserId) {
      toast({
        title: "Error",
        description: "Please enter a User ID",
        variant: "destructive",
      });
      return;
    }

    if (displayUserId.length < 3) {
      toast({
        title: "Error",
        description: "User ID must be at least 3 characters",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      console.log("Updating user ID to:", displayUserId);
      
      // Update the user's metadata in Supabase Auth
      const { error } = await supabase.auth.updateUser({
        data: { display_user_id: displayUserId }
      });

      if (error) throw error;
      
      console.log("User ID updated in auth metadata, refreshing session...");

      // Explicitly refresh the session to ensure changes are propagated
      await refreshSession();
      
      toast({
        title: "User ID updated",
        description: "Your User ID has been successfully updated",
      });
    } catch (error: any) {
      console.error('Error updating User ID:', error);
      toast({
        title: "Update failed",
        description: error.message || "Failed to update User ID",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStartPasswordChange = () => {
    setIsChangingPassword(true);
  };

  const handleVerificationComplete = () => {
    setIsVerified(true);
  };

  const handleCancelVerification = () => {
    setIsChangingPassword(false);
  };

  const accountView = (
    <>
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
          <Label htmlFor="displayUserId">Display User ID</Label>
          <Input 
            id="displayUserId"
            placeholder="Enter your preferred User ID" 
            value={displayUserId}
            onChange={(e) => setDisplayUserId(e.target.value)}
          />
          <p className="text-sm text-gray-500">
            This is how you'll be identified on the site
          </p>
          <Button 
            onClick={handleUpdateUserId} 
            disabled={isUpdating || displayUserId === user?.user_metadata?.display_user_id}
            size="sm"
          >
            {isUpdating ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Updating...
              </>
            ) : "Update User ID"}
          </Button>
        </div>

        <div className="space-y-2 pt-4 border-t">
          <Label>Password</Label>
          <p className="text-sm text-gray-500">
            Change your password (requires verification)
          </p>
          <Button 
            onClick={handleStartPasswordChange} 
            size="sm"
          >
            Change Password
          </Button>
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
      </DialogFooter>
    </>
  );

  const passwordChangeView = (
    <>
      <div className="space-y-4 py-4">
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

      <DialogFooter>
        <Button 
          variant="outline" 
          onClick={() => {
            setIsChangingPassword(false);
            setIsVerified(false);
            setPassword("");
            setConfirmPassword("");
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleUpdatePassword} 
          disabled={isUpdating || !password || password !== confirmPassword}
        >
          {isUpdating ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Updating...
            </>
          ) : "Update Password"}
        </Button>
      </DialogFooter>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Account Settings</DialogTitle>
          <DialogDescription>
            Manage your account information
          </DialogDescription>
        </DialogHeader>

        {isChangingPassword ? (
          isVerified ? (
            passwordChangeView
          ) : (
            <TwoFactorVerification 
              email={user?.email || ""} 
              onVerificationComplete={handleVerificationComplete}
              onCancel={handleCancelVerification}
            />
          )
        ) : (
          accountView
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AccountModal;
