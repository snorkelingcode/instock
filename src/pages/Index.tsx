import React, { useEffect } from "react";
import { Hero } from "@/components/landing/Hero";
import { CardGrid } from "@/components/landing/CardGrid";

const Index = () => {
  useEffect(() => {
    // Load Inter font
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Inter:wght@300;400&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  return (
    <main
      className="min-h-screen bg-[#D9D9D9] px-4 sm:px-6 md:px-10 lg:px-16 py-8 font-['Inter'] max-w-[2000px] mx-auto"
      role="main"
    >
      <Hero />
      <CardGrid />
    </main>
  );
};

export default Index;
