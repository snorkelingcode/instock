
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionType: "like" | "reply" | "report" | "comment";
}

const AuthRequiredModal = ({ isOpen, onClose, actionType }: AuthRequiredModalProps) => {
  const navigate = useNavigate();

  const handleSignIn = () => {
    navigate("/auth");
    onClose();
  };

  const getActionText = () => {
    switch (actionType) {
      case "like":
        return "like comments";
      case "reply":
        return "reply to comments";
      case "report":
        return "report comments";
      case "comment":
        return "post comments";
      default:
        return "perform this action";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign in required</DialogTitle>
          <DialogDescription>
            You need to be signed in to {getActionText()}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <p className="text-sm text-gray-500">
            Create an account or sign in to join the conversation and interact with other members of the community.
          </p>
        </div>

        <DialogFooter className="sm:justify-between flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="sm:w-auto w-full"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSignIn}
            className="sm:w-auto w-full gap-2"
          >
            <LogIn className="h-4 w-4" />
            Sign in / Create account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AuthRequiredModal;
