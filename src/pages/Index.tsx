
import React, { useEffect, useState } from "react";
import { Hero } from "@/components/landing/Hero";
import { CardGrid } from "@/components/landing/CardGrid";
import { ProductService } from "@/services/ProductService";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

const Index = () => {
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url) {
      toast({
        title: "Error",
        description: "Please enter a product URL",
        variant: "destructive",
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      const result = await ProductService.addProductLink(url);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Product link added successfully",
        });
        setUrl("");
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to add product link",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding product link:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main
      className="min-h-screen bg-[#D9D9D9] px-[86px] py-[65px] max-md:p-10 max-sm:p-5 font-['Inter']"
      role="main"
    >
      <Hero />
      
      <div className="mb-12 max-w-lg mx-auto">
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          <h2 className="text-2xl text-[#1E1E1E] font-normal">Check product stock</h2>
          <div className="flex max-sm:flex-col gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter product URL"
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-[#8696E8] rounded-lg text-[#1E1E1E] hover:bg-[#7485d7] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Checking..." : "Check Stock"}
            </button>
          </div>
        </form>
      </div>
      
      <CardGrid />
      <Toaster />
    </main>
  );
};

export default Index;
