
import React from "react";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import UserProfileComponent from "@/components/user/UserProfile";

const UserProfilePage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">User Profile</h1>
        <div className="max-w-4xl mx-auto">
          <UserProfileComponent />
        </div>
      </div>
    </Layout>
  );
};

export default UserProfilePage;
