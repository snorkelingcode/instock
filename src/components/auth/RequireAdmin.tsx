
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/ui/loading-spinner';

const RequireAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (user && !isAdmin) {
      console.log("User is logged in but not an admin:", user.id);
    }
  }, [user, isAdmin]);

  if (isLoading) {
    // Show loading state while checking authentication
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" color="red" />
        <span className="ml-3">Checking admin permissions...</span>
      </div>
    );
  }

  if (!user) {
    // Redirect to login page if not authenticated
    console.log("No user found, redirecting to auth page");
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    // Redirect to home page if not an admin
    console.log("User is not an admin, redirecting to home page");
    return <Navigate to="/" replace />;
  }

  console.log("Admin access granted for user:", user.id);
  return <>{children}</>;
};

export default RequireAdmin;
