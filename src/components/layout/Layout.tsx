
import React from "react";
import Navigation from "@/components/navigation/Navigation";
import Footer from "@/components/layout/Footer";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#F5F5F7] font-['Inter']">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Navigation />
        {children}
        <Footer />
      </div>
    </div>
  );
};

export default Layout;
