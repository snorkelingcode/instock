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
      className="min-h-screen bg-[#D9D9D9] px-[86px] py-[65px] max-md:p-10 max-sm:p-5 font-['Inter']"
      role="main"
    >
      <Hero />
      <CardGrid />
    </main>
  );
};

export default Index;
