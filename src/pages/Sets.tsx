
import React from "react";
import Layout from "@/components/layout/Layout";

const SetsPage = () => {
  return (
    <Layout>
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h1 className="text-2xl font-bold mb-2">Card Sets</h1>
        <p className="text-gray-700 mb-8">
          Explore our collection of card sets. This page will be updated with more content soon.
        </p>
        
        <div className="text-center py-12">
          <h2 className="text-xl font-medium text-gray-500">Coming Soon</h2>
          <p className="mt-4 text-gray-600">
            We're working on bringing you a comprehensive collection of card sets. 
            Check back later for updates.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default SetsPage;
